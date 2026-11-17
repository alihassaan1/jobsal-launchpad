import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

type AdItem = { product_id: string; job_id?: string | null };
type Product = { id: string; slug: string; product_type: string; price: number; duration_days: number; currency: string };

export function allocateDiscount(prices: number[], requestedDiscount: number): number[] {
  const subtotal = prices.reduce((sum, price) => sum + price, 0);
  let remaining = Math.min(Math.max(0, Math.round(requestedDiscount)), subtotal);
  let remainingSubtotal = subtotal;
  return prices.map((price, index) => {
    if (index === prices.length - 1) return remaining;
    const share = remainingSubtotal > 0 ? Math.min(price, Math.floor(remaining * price / remainingSubtotal)) : 0;
    remaining -= share;
    remainingSubtotal -= price;
    return share;
  });
}

function money(cents: number): string {
  return (cents / 100).toFixed(2);
}

export async function handleAdCheckout(options: {
  admin: any;
  userId: string;
  body: { action: "create_ad" | "capture_ad"; items?: AdItem[]; return_url?: string; promo_code?: string; order_id?: string };
  token: string;
  paypalBase: string;
  environment: string;
  safeReturnUrl: (value: string) => URL;
}): Promise<Response> {
  const { admin, userId, body, token, paypalBase, environment, safeReturnUrl } = options;
  const { data: company } = await admin.from("companies").select("id, owner_id").eq("owner_id", userId).maybeSingle();

  if (body.action === "create_ad") {
    if (!company) return json({ error: "Company not found" }, 404);
    const items = body.items ?? [];
    const productIds = [...new Set(items.map((item) => item.product_id))];
    const { data: products, error: productError } = await admin.from("ad_products")
      .select("id, slug, product_type, price, duration_days, currency").in("id", productIds).eq("is_active", true);
    if (productError) throw productError;
    const byId = new Map<string, Product>((products ?? []).map((product: Product) => [product.id, product]));
    if (byId.size !== productIds.length || products?.some((product: Product) => product.currency !== "EUR")) {
      return json({ error: "An advertising product is unavailable" }, 400);
    }

    const jobIds = [...new Set(items.map((item) => item.job_id).filter(Boolean))];
    if (jobIds.length) {
      const { data: jobs } = await admin.from("jobs").select("id, company_id").in("id", jobIds);
      if ((jobs ?? []).length !== jobIds.length || jobs?.some((job: { company_id: string }) => job.company_id !== company.id)) {
        return json({ error: "A selected job does not belong to your company" }, 403);
      }
    }

    const orderedProducts = items.map((item) => byId.get(item.product_id)!);
    const subtotal = orderedProducts.reduce((sum, product) => sum + product.price, 0);
    let discount = 0;
    let promo: any = null;
    if (body.promo_code) {
      const { data: code } = await admin.from("promo_codes").select("*").eq("code", body.promo_code.toUpperCase()).eq("is_active", true).maybeSingle();
      const now = Date.now();
      const applicable = !Array.isArray(code?.applicable_products) || code.applicable_products.length === 0 || orderedProducts.every((product) =>
        code.applicable_products.includes(product.id) || code.applicable_products.includes(product.slug) || code.applicable_products.includes(product.product_type));
      if (!code || (code.valid_from && new Date(code.valid_from).getTime() > now) || (code.valid_until && new Date(code.valid_until).getTime() < now)
        || (code.min_purchase_amount && subtotal < code.min_purchase_amount) || (code.max_uses && code.current_uses >= code.max_uses) || !applicable) {
        return json({ error: "Promo code is invalid, expired, or not applicable" }, 400);
      }
      promo = code;
      discount = code.discount_type === "percentage" ? Math.round(subtotal * code.discount_value / 100) : code.discount_value;
      discount = Math.min(subtotal, Math.max(0, discount));
    }
    const total = subtotal - discount;
    if (total <= 0) return json({ error: "This promotion needs manual checkout because it covers the full total" }, 400);
    const discounts = allocateDiscount(orderedProducts.map((product) => product.price), discount);
    const start = new Date();
    const purchaseRows = items.map((item, index) => {
      const product = orderedProducts[index];
      return {
        company_id: company.id,
        job_id: item.job_id ?? null,
        ad_product_id: product.id,
        user_id: userId,
        start_date: start.toISOString(),
        end_date: new Date(start.getTime() + product.duration_days * 86400000).toISOString(),
        status: "pending",
        amount_paid: product.price - discounts[index],
        currency: "EUR",
        payment_method: "paypal",
        promo_code_id: promo?.id ?? null,
        discount_applied: discounts[index],
      };
    });
    const { data: purchases, error: purchaseError } = await admin.from("ad_purchases").insert(purchaseRows).select("id");
    if (purchaseError || !purchases?.length) return json({ error: "Could not prepare the advertising order" }, 500);

    const ret = safeReturnUrl(body.return_url!);
    const response = await fetch(`${paypalBase}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "PayPal-Request-Id": crypto.randomUUID() },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{ description: "Jobs.al advertising", custom_id: `ads:${purchases[0].id}`, amount: { currency_code: "EUR", value: money(total) } }],
        application_context: { brand_name: "Jobs.al", user_action: "PAY_NOW", shipping_preference: "NO_SHIPPING", return_url: ret.toString(), cancel_url: ret.toString() },
      }),
    });
    const order = await response.json();
    if (!response.ok) return json({ error: "PayPal could not create the order" }, 502);
    const { data: localOrder, error: orderError } = await admin.from("paypal_orders").insert({
      user_id: userId,
      paypal_order_id: order.id,
      product_key: "ad_checkout",
      amount_cents: total,
      currency: "EUR",
      listing_credits: 0,
      featured_days: 0,
      environment,
      urgent: false,
    }).select("id").single();
    if (orderError) return json({ error: "Could not save the payment order; no payment has been taken" }, 500);
    const { error: linkError } = await admin.from("ad_purchases").update({ paypal_order_id: localOrder.id }).in("id", purchases.map((purchase: { id: string }) => purchase.id));
    if (linkError) return json({ error: "Could not link the advertising order; no payment has been taken" }, 500);
    return json({ order_id: order.id, total_cents: total });
  }

  const { data: row } = await admin.from("paypal_orders").select("*").eq("paypal_order_id", body.order_id).eq("product_key", "ad_checkout").maybeSingle();
  if (!row || row.user_id !== userId || row.environment !== environment) return json({ error: "Order not found" }, 404);
  if (row.status === "completed") return json({ status: "completed" });
  const response = await fetch(`${paypalBase}/v2/checkout/orders/${body.order_id}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "PayPal-Request-Id": `cap-${row.id}` },
  });
  let capture = await response.json();
  if (!response.ok) {
    const read = await fetch(`${paypalBase}/v2/checkout/orders/${body.order_id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (read.ok) capture = await read.json();
  }
  const captured = capture.purchase_units?.[0]?.payments?.captures?.[0];
  const paid = capture.status === "COMPLETED" && captured?.status === "COMPLETED"
    && captured?.amount?.value === money(row.amount_cents) && captured?.amount?.currency_code === "EUR";
  if (!paid) return json({ error: "Payment was not completed" }, 402);
  const { data: activated, error: settlementError } = await admin.rpc("settle_ad_order", { _order_id: row.id });
  if (settlementError) return json({ error: "Payment received; ad activation is pending. Contact info@jobs.al with your order ID." }, 500);
  return json({ status: "completed", activated });
}
