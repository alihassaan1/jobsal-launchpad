import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

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

async function verifyWebhook(req: Request, event: unknown, token: string) {
  const webhookId = Deno.env.get("PAYPAL_WEBHOOK_ID");
  if (!webhookId) return false; // not configured yet: refuse rather than trust
  const res = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_algo: req.headers.get("paypal-auth-algo"),
      cert_url: req.headers.get("paypal-cert-url"),
      transmission_id: req.headers.get("paypal-transmission-id"),
      transmission_sig: req.headers.get("paypal-transmission-sig"),
      transmission_time: req.headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: event,
    }),
  });
  const out = await res.json();
  return res.ok && out.verification_status === "SUCCESS";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const event = await req.json();
    const token = await paypalToken();
    if (!(await verifyWebhook(req, event, token))) return json({ error: "Invalid webhook signature" }, 401);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const type: string = event.event_type ?? "";
    const resource = event.resource ?? {};
    const paypalSubId: string | undefined = resource.id ?? resource.billing_agreement_id;

    if (!paypalSubId || !type.startsWith("BILLING.SUBSCRIPTION.") && type !== "PAYMENT.SALE.COMPLETED") {
      return json({ ignored: type });
    }

    const { data: local } = await admin.from("subscriptions").select("id, user_id")
      .eq("paypal_subscription_id", paypalSubId).maybeSingle();
    if (!local) return json({ ignored: "unknown subscription" });

    if (type === "PAYMENT.SALE.COMPLETED") {
      const amount = Number(resource.amount?.total ?? 0);
      const now = new Date();
      const next = new Date(now); next.setMonth(next.getMonth() + 1);
      await admin.from("subscriptions").update({
        status: "active",
        last_payment_at: now.toISOString(),
        last_payment_amount: amount,
        current_period_start: now.toISOString(),
        current_period_end: next.toISOString(),
        updated_at: now.toISOString(),
      }).eq("id", local.id);
      await admin.from("payment_transactions").insert({
        user_id: local.user_id,
        subscription_id: local.id,
        amount: Math.round(amount * 100),
        currency: resource.amount?.currency ?? "EUR",
        payment_method: "paypal",
        payment_provider_id: resource.id,
        status: "completed",
        metadata: { source: "paypal_webhook", event: type },
      });
      return json({ ok: true, renewed: paypalSubId });
    }

    const statusMap: Record<string, string> = {
      "BILLING.SUBSCRIPTION.ACTIVATED": "active",
      "BILLING.SUBSCRIPTION.SUSPENDED": "past_due",
      "BILLING.SUBSCRIPTION.CANCELLED": "cancelled",
      "BILLING.SUBSCRIPTION.EXPIRED": "expired",
      "BILLING.SUBSCRIPTION.PAYMENT.FAILED": "past_due",
    };
    const status = statusMap[type];
    if (status) {
      await admin.from("subscriptions").update({
        status,
        cancelled_at: status === "cancelled" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }).eq("id", local.id);
    }
    return json({ ok: true, status });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
