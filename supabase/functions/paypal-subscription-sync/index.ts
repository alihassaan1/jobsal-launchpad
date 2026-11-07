import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

// Daily safety net: re-sync PayPal subscriptions whose period ends within 3 days
// (or that are stuck in pending/past_due), in case a webhook was missed.
const PAYPAL_BASE = Deno.env.get("PAYPAL_ENV") === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function paypalToken() {
  const id = Deno.env.get("PAYPAL_CLIENT_ID")!;
  const secret = Deno.env.get("PAYPAL_CLIENT_SECRET")!;
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${id}:${secret}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal auth failed (${res.status})`);
  return (await res.json()).access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    // Callable by the daily cron (anon key) or service role. It only triggers a
    // re-sync with PayPal and returns counts — no employer data is exposed.
    const auth = req.headers.get("Authorization") ?? "";
    const allowed = [Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), Deno.env.get("SUPABASE_ANON_KEY")];
    if (!allowed.some((k) => k && auth === `Bearer ${k}`)) {
      return json({ error: "Forbidden" }, 403);
    }
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const soon = new Date(Date.now() + 3 * 86400000).toISOString();

    const { data: subs } = await admin.from("subscriptions")
      .select("id, paypal_subscription_id, status")
      .not("paypal_subscription_id", "is", null)
      .or(`status.in.(trial,expired),and(status.eq.active,current_period_end.lt.${soon})`);

    if (!subs || subs.length === 0) return json({ synced: 0 });

    const token = await paypalToken();
    const statusMap: Record<string, string> = {
      ACTIVE: "active", APPROVAL_PENDING: "trial", APPROVED: "trial",
      SUSPENDED: "expired", CANCELLED: "cancelled", EXPIRED: "expired",
    };
    let synced = 0;
    for (const s of subs) {
      const res = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions/${s.paypal_subscription_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) continue;
      const sub = await res.json();
      const lastPayment = sub.billing_info?.last_payment;
      await admin.from("subscriptions").update({
        status: statusMap[sub.status] ?? s.status,
        current_period_start: lastPayment?.time ?? sub.start_time ?? null,
        current_period_end: sub.billing_info?.next_billing_time ?? null,
        last_payment_at: lastPayment?.time ?? null,
        last_payment_amount: lastPayment ? Number(lastPayment.amount?.value ?? 0) : null,
        cancelled_at: sub.status === "CANCELLED" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }).eq("id", s.id);
      synced++;
    }
    return json({ synced });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
