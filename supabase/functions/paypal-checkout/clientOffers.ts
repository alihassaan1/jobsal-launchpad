import { PAYPAL_PRODUCTS } from "./products.ts";

export const CLIENT_OFFER_VALID_UNTIL = "2026-11-17T00:00:00.000Z";
export const CLIENT_PACKAGES = Object.values(PAYPAL_PRODUCTS).filter(p => p.kind === "client_package");

export type CustomOfferTerms = { package_name: string; amount_cents: number; credit_limit: number; duration_months: number; starts_at: string; offer_expires_at: string };

export function validCustomOffer(terms: CustomOfferTerms, now = new Date()) {
  return terms.package_name.trim().length > 0 && terms.package_name.length <= 120
    && Number.isSafeInteger(terms.amount_cents) && terms.amount_cents > 0
    && Number.isSafeInteger(terms.credit_limit) && terms.credit_limit > 0
    && Number.isInteger(terms.duration_months) && terms.duration_months >= 1 && terms.duration_months <= 120
    && Number.isFinite(Date.parse(terms.starts_at)) && new Date(terms.starts_at) >= new Date(now.toISOString().slice(0, 10))
    && Number.isFinite(Date.parse(terms.offer_expires_at)) && new Date(terms.offer_expires_at) > now;
}

// Checkout always uses stored private terms, never values sent by the buyer.
export function offerProduct(offer: { product_key: string; package_name?: string | null; amount_cents: number; credit_limit: number; duration_months: number }) {
  return { key: offer.product_key, name: offer.package_name || PAYPAL_PRODUCTS[offer.product_key]?.name || "Private employer package", amount_cents: offer.amount_cents, listing_credits: offer.credit_limit, featured_days: 0, duration_months: offer.duration_months, kind: "client_package" as const };
}

export function offerExpiry(start: string, months: number) {
  const date = new Date(start);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString();
}

export function canPurchaseOffer(offer: { status: string; offer_expires_at: string; expires_at: string }, now = new Date()) {
  return offer.status === "offered" && new Date(offer.offer_expires_at) > now && new Date(offer.expires_at) > now;
}

export function canUseOffer(offer: { status: string; starts_at: string; expires_at: string; credits_used: number; credit_limit: number }, now = new Date()) {
  return offer.status === "paid" && new Date(offer.starts_at) <= now && new Date(offer.expires_at) > now && offer.credits_used < offer.credit_limit;
}