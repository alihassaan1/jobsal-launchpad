import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { PAYPAL_PRODUCTS, formatEur, type PaypalProduct } from "./products.ts";
import { canPurchaseOffer, canUseOffer, offerExpiry, CLIENT_OFFER_VALID_UNTIL } from "./clientOffers.ts";

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

// Create (or reuse) the PayPal billing plan for a monthly package.
async function ensurePaypalPlan(admin: ReturnType<typeof createClient>, token: string, product: PaypalProduct) {
  const { data: existing } = await admin.from("paypal_plans").select("*")
    .eq("product_key", product.key).eq("environment", ENV).maybeSingle();
  if (existing) return existing.paypal_plan_id as string;

  const prodRes = await fetch(`${PAYPAL_BASE}/v1/catalogs/products`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: product.name, type: "SERVICE", category: "SOFTWARE" }),
  });
  const prod = await prodRes.json();
  if (!prodRes.ok) throw new Error("PayPal could not create the product");

  const planRes = await fetch(`${PAYPAL_BASE}/v1/billing/plans`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      product_id: prod.id,
      name: product.name,
      billing_cycles: [{
        frequency: { interval_unit: "MONTH", interval_count: 1 },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0, // 0 = renews until cancelled
        pricing_scheme: { fixed_price: { value: formatEur(product.amount_cents), currency_code: "EUR" } },
      }],
      payment_preferences: { auto_bill_outstanding: true, payment_failure_threshold: 3 },
    }),
  });
  const plan = await planRes.json();
  if (!planRes.ok) throw new Error("PayPal could not create the billing plan");

  await admin.from("paypal_plans").upsert({
    product_key: product.key, paypal_product_id: prod.id, paypal_plan_id: plan.id, environment: ENV,
  });
  return plan.id as string;
}

// Sync a PayPal subscription's state into our subscriptions table.
async function syncSubscription(
  admin: ReturnType<typeof createClient>,
  token: string,
  paypalSubId: string,
  userId: string,
) {
  const res = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions/${paypalSubId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const sub = await res.json();
  if (!res.ok) return { error: "Could not read the subscription from PayPal" };

  const { data: local } = await admin.from("subscriptions").select("*")
    .eq("paypal_subscription_id", paypalSubId).maybeSingle();
  const product = local?.plan_slug
    ? Object.values(PAYPAL_PRODUCTS).find((p) => p.plan_slug === local.plan_slug)
    : undefined;

  const statusMap: Record<string, string> = {
    ACTIVE: "active", APPROVAL_PENDING: "pending", APPROVED: "pending",
    SUSPENDED: "past_due", CANCELLED: "cancelled", EXPIRED: "expired",
  };
  const status = statusMap[sub.status] ?? "pending";
  const start = sub.billing_info?.last_payment?.time ?? sub.start_time ?? sub.create_time;
  const nextBilling = sub.billing_info?.next_billing_time ?? null;

  const update: Record<string, unknown> = {
    status,
    current_period_start: start ? new Date(start).toISOString() : null,
    current_period_end: nextBilling ? new Date(nextBilling).toISOString() : null,
    cancelled_at: status === "cancelled" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };
  if (sub.billing_info?.last_payment) {
    update.last_payment_at = new Date(sub.billing_info.last_payment.time).toISOString();
    update.last_payment_amount = Number(sub.billing_info.last_payment.amount?.value ?? 0);
  }

  if (local) {
    await admin.from("subscriptions").update(update).eq("id", local.id);
  } else {
    await admin.from("subscriptions").insert({
      user_id: userId,
      tier: product?.plan_slug ?? "starter",
      status,
      paypal_subscription_id: paypalSubId,
      paypal_plan_id: sub.plan_id,
      plan_slug: product?.plan_slug ?? null,
      amount_eur: product ? product.amount_cents / 100 : null,
      currency: "EUR",
      job_posts_limit: product?.listing_credits ?? 0,
      ...update,
    });
  }
  return { status, next_billing: nextBilling };
}

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("config") }),
  z.object({ action: z.literal("create"), product_key: z.string().max(50), return_url: z.string().url().max(500), job_id: z.string().uuid().optional(), offer_id: z.string().uuid().optional(), urgent: z.boolean().optional() }),
  z.object({ action: z.literal("assign_offer"), company_id: z.string().uuid(), product_key: z.string().max(50), starts_at: z.string().datetime() }),
  z.object({ action: z.literal("capture"), order_id: z.string().min(5).max(64) }),
  z.object({ action: z.literal("subscribe"), product_key: z.string().max(50), return_url: z.string().url().max(500) }),
  z.object({ action: z.literal("activate"), subscription_id: z.string().min(5).max(64) }),
  z.object({ action: z.literal("cancel"), subscription_id: z.string().min(5).max(64) }),
  z.object({ action: z.literal("publish_free"), job_id: z.string().uuid(), offer_id: z.string().uuid().optional() }),
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

    // Public client config so the PayPal JS SDK buttons can load (client id is publishable).
    if (body.action === "config") {
      return json({ client_id: Deno.env.get("PAYPAL_CLIENT_ID"), env: ENV, currency: "EUR" });
    }

    if (body.action === "assign_offer") {
      const { data: roles, error: roleError } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
      if (roleError || !roles?.length) return json({ error: "Admin access required" }, 403);
      const product = PAYPAL_PRODUCTS[body.product_key];
      if (product?.kind !== "client_package" || !product.duration_months) return json({ error: "Unknown client package" }, 400);
      if (new Date() >= new Date(CLIENT_OFFER_VALID_UNTIL)) return json({ error: "Quotation expired" }, 400);
      const { data: company } = await admin.from("companies").select("id, name, owner_id").eq("id", body.company_id).maybeSingle();
      if (!company?.owner_id) return json({ error: "Select the client's registered company with an owner account" }, 400);
      const { data: employerRole } = await admin.from("user_roles").select("role").eq("user_id", company.owner_id).eq("role", "employer").maybeSingle();
      if (!employerRole) return json({ error: "Company owner must be an employer" }, 400);
      const starts = new Date(body.starts_at);
      if (starts < new Date(new Date().toISOString().slice(0, 10))) return json({ error: "Choose an agreed activation date today or later" }, 400);
      const { data, error } = await admin.from("client_package_offers").insert({
        company_id: company.id, employer_user_id: company.owner_id, product_key: product.key,
        amount_cents: product.amount_cents, credit_limit: product.listing_credits, duration_months: product.duration_months,
        starts_at: starts.toISOString(), expires_at: offerExpiry(starts.toISOString(), product.duration_months), assigned_by: user.id,
        offer_expires_at: CLIENT_OFFER_VALID_UNTIL,
      }).select("id").single();
      if (error) return json({ error: error.code === "23505" ? "This company already has an unpaid offer" : "Could not assign offer" }, 400);
      return json({ offer_id: data.id });
    }

    if (body.action === "publish_free") {
      const { data: job } = await admin.from("jobs").select("id, posted_by, is_active, payment_status, title")
        .eq("id", body.job_id).maybeSingle();
      if (!job || job.posted_by !== user.id) return json({ error: "Job not found" }, 404);
      if (job.is_active) return json({ status: "already_live" });

      if (body.offer_id) {
        const { data: offer } = await admin.from("client_package_offers").select("*").eq("id", body.offer_id).eq("employer_user_id", user.id).maybeSingle();
        if (!offer || !canUseOffer(offer)) return json({ error: "No active client package credits available" }, 403);
        const { data: status, error } = await admin.rpc("publish_client_package_job", { _offer_id: offer.id, _job_id: job.id, _user_id: user.id });
        if (error) return json({ error: "Could not use package credit" }, 409);
        return json({ status, via: offer.product_key });
      }

      const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);

      // (a) One free standard listing per employer per calendar month.
      const { count: freeUsed } = await admin.from("job_listings").select("id", { count: "exact", head: true })
        .eq("employer_user_id", user.id).eq("product_key", "free_monthly")
        .gte("created_at", monthStart.toISOString());

      // (b) Or a monthly package with remaining listing slots in the current period.
      const { data: sub } = await admin.from("subscriptions").select("*")
        .eq("user_id", user.id).eq("status", "active")
        .not("paypal_subscription_id", "is", null)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      let packageSlot = false;
      if (sub) {
        const periodStart = sub.current_period_start ?? sub.created_at;
        const { count: used } = await admin.from("job_listings").select("id", { count: "exact", head: true })
          .eq("employer_user_id", user.id).eq("product_key", `package:${sub.plan_slug}`)
          .gte("created_at", periodStart);
        packageSlot = (used ?? 0) < (sub.job_posts_limit ?? 0);
      }

      if ((freeUsed ?? 0) === 0 || packageSlot) {
        const productKey = packageSlot && sub ? `package:${sub.plan_slug}` : "free_monthly";
        const ends = new Date(); ends.setDate(ends.getDate() + 30);
        await admin.from("jobs").update({ is_active: true, payment_status: "free", updated_at: new Date().toISOString() })
          .eq("id", job.id);
        await admin.from("job_listings").insert({
          employer_user_id: user.id, job_id: job.id, product_key: productKey, listing_tier: "standard",
          price_eur: 0, ends_at: ends.toISOString(),
        });
        return json({ status: "published", via: productKey });
      }
      return json({ error: "No free listing or package slot available this month" }, 403);
    }

    const token = await paypalToken();

    if (body.action === "create") {
      const product = PAYPAL_PRODUCTS[body.product_key];
      if (!product || product.kind === "subscription") return json({ error: "Unknown product" }, 400);
      let offerId: string | null = null;
      if (product.kind === "client_package") {
        if (!body.offer_id || body.job_id) return json({ error: "Client offer required" }, 400);
        const { data: offer } = await admin.from("client_package_offers").select("*").eq("id", body.offer_id).eq("employer_user_id", user.id).maybeSingle();
        if (!offer || offer.product_key !== product.key || offer.amount_cents !== product.amount_cents || !canPurchaseOffer(offer)) return json({ error: "Offer unavailable or expired" }, 403);
        const { data: company } = await admin.from("companies").select("owner_id").eq("id", offer.company_id).maybeSingle();
        if (company?.owner_id !== user.id) return json({ error: "Offer belongs to another company account" }, 403);
        offerId = offer.id;
        // Reuse the unpaid order, preventing a double purchase on repeated clicks.
        const { data: pending } = await admin.from("paypal_orders").select("paypal_order_id").eq("client_offer_id", offerId).eq("status", "created").order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (pending) {
          const previous = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${pending.paypal_order_id}`, { headers: { Authorization: `Bearer ${token}` } });
          const order = await previous.json();
          if (previous.ok && ["CREATED", "APPROVED", "PAYER_ACTION_REQUIRED"].includes(order.status)) return json({ order_id: order.id, approve_url: order.links?.find((l: { rel: string }) => l.rel === "approve")?.href });
        }
      }
      let jobId: string | null = null;
      if (body.job_id) {
        const { data: job } = await admin.from("jobs").select("id, posted_by").eq("id", body.job_id).maybeSingle();
        if (!job || job.posted_by !== user.id) return json({ error: "Job not found" }, 404);
        jobId = job.id;
      }
      // Urgent hiring is charged as part of the same order so the buyer approves the full total once.
      const urgentAddon = body.urgent && product.kind === "listing" && product.key !== "urgent_hiring" && jobId
        ? PAYPAL_PRODUCTS.urgent_hiring
        : null;
      const totalCents = product.amount_cents + (urgentAddon?.amount_cents ?? 0);
      const ret = new URL(body.return_url);
      const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{ description: urgentAddon ? `${product.name} + ${urgentAddon.name}` : product.name, custom_id: `${user.id}:${product.key}`,
            amount: { currency_code: "EUR", value: formatEur(totalCents) } }],
          application_context: { brand_name: "Jobs.al", user_action: "PAY_NOW",
            return_url: `${ret.origin}${ret.pathname}?paypal=return`, cancel_url: `${ret.origin}${ret.pathname}?paypal=cancel` },
        }),
      });
      const order = await res.json();
      if (!res.ok) return json({ error: "PayPal could not create the order" }, 502);
      await admin.from("paypal_orders").insert({
        user_id: user.id, paypal_order_id: order.id, product_key: product.key, amount_cents: totalCents,
        listing_credits: product.listing_credits, featured_days: product.featured_days, environment: ENV,
        job_id: jobId, client_offer_id: offerId, urgent: !!urgentAddon,
      });
      const approve = order.links?.find((l: { rel: string }) => l.rel === "approve")?.href;
      return json({ order_id: order.id, approve_url: approve });
    }

    if (body.action === "capture") {
      const { data: row } = await admin.from("paypal_orders").select("*").eq("paypal_order_id", body.order_id).maybeSingle();
      if (!row || row.user_id !== user.id) return json({ error: "Order not found" }, 404);
      if (row.status === "completed") return json({ status: "completed", product_key: row.product_key, offer_id: row.client_offer_id });
      if (row.client_offer_id) {
        const { data: offer } = await admin.from("client_package_offers").select("status").eq("id", row.client_offer_id).maybeSingle();
        if (!offer || offer.status !== "offered") return json({ error: "Offer is no longer available for payment" }, 409);
      }
      const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${body.order_id}/capture`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      let cap = await res.json();
      // Recover a completed capture if the previous response was lost.
      if (!res.ok) {
        const read = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${body.order_id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (read.ok) cap = await read.json();
      }
      const captured = cap.purchase_units?.[0]?.payments?.captures?.[0];
      const ok = cap.status === "COMPLETED" && captured?.status === "COMPLETED" && captured?.amount?.value === formatEur(row.amount_cents)
        && captured?.amount?.currency_code === "EUR";
      if (row.client_offer_id && ok) {
        const { error } = await admin.rpc("settle_client_package", { _order_id: row.id });
        if (error) return json({ error: "Payment received; package confirmation pending. Please contact support with your order ID." }, 500);
        return json({ status: "completed", product_key: row.product_key, offer_id: row.client_offer_id });
      }
      await admin.from("paypal_orders").update({ status: ok ? "completed" : "failed", captured_at: ok ? new Date().toISOString() : null })
        .eq("id", row.id);
      if (!ok) return json({ error: "Payment was not completed" }, 402);

      const product = PAYPAL_PRODUCTS[row.product_key];
      if (product) {
        const ends = new Date(); ends.setDate(ends.getDate() + 30);
        const featuredUntil = product.featured_days > 0 ? new Date(Date.now() + product.featured_days * 86400000) : null;
        await admin.from("job_listings").insert({
          employer_user_id: user.id, job_id: row.job_id ?? null, product_key: product.key, listing_tier: product.key,
          price_eur: product.amount_cents / 100, ends_at: ends.toISOString(),
          featured_until: featuredUntil?.toISOString() ?? null, paypal_order_id: row.id,
        });
        // Apply the urgent add-on paid for in the same order.
        if (row.urgent && row.job_id) {
          const urgentProduct = PAYPAL_PRODUCTS.urgent_hiring;
          await admin.from("job_listings").insert({
            employer_user_id: user.id, job_id: row.job_id, product_key: urgentProduct.key, listing_tier: urgentProduct.key,
            price_eur: urgentProduct.amount_cents / 100, ends_at: ends.toISOString(),
            featured_until: new Date(Date.now() + urgentProduct.featured_days * 86400000).toISOString(), paypal_order_id: row.id,
          });
        }
        // Publish the job this order paid for.
        if (row.job_id) {
          await admin.from("jobs").update({
            is_active: true, payment_status: "paid",
            is_featured: product.featured_days > 0 || !!row.urgent,
            updated_at: new Date().toISOString(),
          }).eq("id", row.job_id).eq("posted_by", user.id);
        }
      }
      return json({ status: "completed", product_key: row.product_key, job_id: row.job_id ?? null });
    }

    if (body.action === "subscribe") {
      const product = PAYPAL_PRODUCTS[body.product_key];
      if (!product || product.kind !== "subscription") return json({ error: "Unknown package" }, 400);

      // One active subscription per employer at a time.
      const { data: active } = await admin.from("subscriptions").select("id")
        .eq("user_id", user.id).in("status", ["active", "pending", "past_due"])
        .not("paypal_subscription_id", "is", null).limit(1);
      if (active && active.length > 0) {
        return json({ error: "You already have an active package. Cancel it before switching." }, 409);
      }

      const planId = await ensurePaypalPlan(admin, token, product);
      const ret = new URL(body.return_url);
      const res = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: planId,
          custom_id: `${user.id}:${product.key}`,
          application_context: { brand_name: "Jobs.al", user_action: "SUBSCRIBE_NOW",
            return_url: `${ret.origin}${ret.pathname}?paypal=subscribe-return`,
            cancel_url: `${ret.origin}${ret.pathname}?paypal=cancel` },
        }),
      });
      const sub = await res.json();
      if (!res.ok) return json({ error: "PayPal could not create the subscription" }, 502);

      await admin.from("subscriptions").insert({
        user_id: user.id,
        tier: product.plan_slug ?? "starter",
        status: "pending",
        paypal_subscription_id: sub.id,
        paypal_plan_id: planId,
        plan_slug: product.plan_slug,
        amount_eur: product.amount_cents / 100,
        currency: "EUR",
        job_posts_limit: product.listing_credits,
      });
      const approve = sub.links?.find((l: { rel: string }) => l.rel === "approve")?.href;
      return json({ subscription_id: sub.id, approve_url: approve });
    }

    if (body.action === "activate") {
      const { data: local } = await admin.from("subscriptions").select("user_id")
        .eq("paypal_subscription_id", body.subscription_id).maybeSingle();
      if (!local || local.user_id !== user.id) return json({ error: "Subscription not found" }, 404);
      const result = await syncSubscription(admin, token, body.subscription_id, user.id);
      if ("error" in result) return json({ error: result.error }, 502);
      return json(result);
    }

    // cancel
    const { data: local } = await admin.from("subscriptions").select("user_id, status")
      .eq("paypal_subscription_id", body.subscription_id).maybeSingle();
    if (!local || local.user_id !== user.id) return json({ error: "Subscription not found" }, 404);
    const res = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions/${body.subscription_id}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Employer requested cancellation on Jobs.al" }),
    });
    if (!res.ok && res.status !== 204) return json({ error: "PayPal could not cancel the subscription" }, 502);
    await syncSubscription(admin, token, body.subscription_id, user.id);
    return json({ status: "cancelled" });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
