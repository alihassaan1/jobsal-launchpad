import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { PAYPAL_PRODUCTS, formatEur } from "./products.ts";

const PAYPAL_BASE = Deno.env.get("PAYPAL_ENV") === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";
const ENV = Deno.env.get("PAYPAL_ENV") === "live" ? "live" : "sandbox";

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

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), product_key: z.string().max(50), return_url: z.string().url().max(500) }),
  z.object({ action: z.literal("capture"), order_id: z.string().min(5).max(64) }),
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Please sign in" }, 401);
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const body = parsed.data;
    const token = await paypalToken();

    if (body.action === "create") {
      const product = PAYPAL_PRODUCTS[body.product_key];
      if (!product) return json({ error: "Unknown product" }, 400);
      const ret = new URL(body.return_url);
      const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{ description: product.name, custom_id: `${user.id}:${product.key}`,
            amount: { currency_code: "EUR", value: formatEur(product.amount_cents) } }],
          application_context: { brand_name: "Jobs.al", user_action: "PAY_NOW",
            return_url: `${ret.origin}${ret.pathname}?paypal=return`, cancel_url: `${ret.origin}${ret.pathname}?paypal=cancel` },
        }),
      });
      const order = await res.json();
      if (!res.ok) return json({ error: "PayPal could not create the order" }, 502);
      await admin.from("paypal_orders").insert({
        user_id: user.id, paypal_order_id: order.id, product_key: product.key, amount_cents: product.amount_cents,
        listing_credits: product.listing_credits, featured_days: product.featured_days, environment: ENV,
      });
      const approve = order.links?.find((l: { rel: string }) => l.rel === "approve")?.href;
      return json({ order_id: order.id, approve_url: approve });
    }

    // capture
    const { data: row } = await admin.from("paypal_orders").select("*").eq("paypal_order_id", body.order_id).maybeSingle();
    if (!row || row.user_id !== user.id) return json({ error: "Order not found" }, 404);
    if (row.status === "completed") return json({ status: "completed", product_key: row.product_key });
    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${body.order_id}/capture`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const cap = await res.json();
    const captured = cap.purchase_units?.[0]?.payments?.captures?.[0];
    const ok = res.ok && cap.status === "COMPLETED" && captured?.amount?.value === formatEur(row.amount_cents)
      && captured?.amount?.currency_code === "EUR";
    await admin.from("paypal_orders").update({ status: ok ? "completed" : "failed", captured_at: ok ? new Date().toISOString() : null })
      .eq("id", row.id);
    if (!ok) return json({ error: "Payment was not completed" }, 402);
    return json({ status: "completed", product_key: row.product_key });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
