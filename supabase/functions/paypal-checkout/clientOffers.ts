import { PAYPAL_PRODUCTS } from "./products.ts";

export const CLIENT_OFFER_VALID_UNTIL = "2026-11-17T00:00:00.000Z";
export const CLIENT_PACKAGES = Object.values(PAYPAL_PRODUCTS).filter(p => p.kind === "client_package");

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