import { describe, expect, it } from "vitest";
import { PAYPAL_PRODUCTS } from "../../supabase/functions/paypal-checkout/products";
import { canPurchaseOffer, canUseOffer, offerExpiry, CLIENT_OFFER_VALID_UNTIL, validCustomOffer, offerProduct } from "../../supabase/functions/paypal-checkout/clientOffers";

describe("TIA client-only quotation", () => {
  it("Pilot costs €250 for 3 months and 10 total credits", () => {
    expect(PAYPAL_PRODUCTS.tia_pilot).toMatchObject({ amount_cents: 25000, duration_months: 3, listing_credits: 10, kind: "client_package" });
  });
  it("Standard costs €600 for 6 months and 30 total credits", () => {
    expect(PAYPAL_PRODUCTS.tia_standard).toMatchObject({ amount_cents: 60000, duration_months: 6, listing_credits: 30, kind: "client_package" });
  });
  it("Annual costs €1200 for 12 months and 80 total credits, not a recurring subscription", () => {
    expect(PAYPAL_PRODUCTS.tia_annual).toMatchObject({ amount_cents: 120000, duration_months: 12, listing_credits: 80, kind: "client_package" });
  });
  const offer = { status: "paid", starts_at: "2026-10-17T00:00:00Z", expires_at: "2027-01-17T00:00:00Z", credits_used: 9, credit_limit: 10 };
  it("expires unused credits at package end", () => {
    expect(canUseOffer(offer, new Date("2027-01-16T23:59:59Z"))).toBe(true);
    expect(canUseOffer(offer, new Date(offer.expires_at))).toBe(false);
  });
  it("does not reset total credits monthly or exceed the limit", () => {
    expect(canUseOffer({ ...offer, credits_used: 10 }, new Date("2026-11-18"))).toBe(false);
  });
  it("requires verified payment and the agreed activation date", () => {
    expect(canUseOffer({ ...offer, status: "offered" }, new Date("2026-10-18"))).toBe(false);
    expect(canUseOffer(offer, new Date("2026-10-16"))).toBe(false);
  });
  it("accepts the quotation through 16 November only", () => {
    const offered = { ...offer, status: "offered", offer_expires_at: CLIENT_OFFER_VALID_UNTIL };
    expect(canPurchaseOffer(offered, new Date("2026-11-16T23:59:59Z"))).toBe(true);
    expect(canPurchaseOffer(offered, new Date("2026-11-17T00:00:00Z"))).toBe(false);
  });
  it("computes calendar month expiry, clamping short months", () => {
    expect(offerExpiry("2026-10-17T00:00:00Z", 3)).toBe("2027-01-17T00:00:00.000Z");
    expect(offerExpiry("2026-08-31T00:00:00Z", 6)).toBe("2027-02-28T00:00:00.000Z");
  });
});

describe("Private configurable employer packages", () => {
  const terms = { package_name: "Agreed employer package", amount_cents: 37500, credit_limit: 17, duration_months: 4, starts_at: "2026-11-10T00:00:00Z", offer_expires_at: "2026-12-01T00:00:00Z" };
  it("accepts a private price, job allowance and duration independently of public tiers", () => {
    expect(validCustomOffer(terms, new Date("2026-11-07"))).toBe(true);
    expect(offerExpiry(terms.starts_at, 4)).toBe("2027-03-10T00:00:00.000Z");
  });
  it("charges the stored private price and grants the stored allowance", () => {
    expect(offerProduct({ ...terms, product_key: "custom_package" })).toMatchObject({ amount_cents: 37500, listing_credits: 17, duration_months: 4, kind: "client_package" });
    expect(PAYPAL_PRODUCTS.starter_monthly.amount_cents).toBe(4900);
  });
  it("rejects fractional credits and invalid amounts", () => {
    expect(validCustomOffer({ ...terms, credit_limit: 1.5 }, new Date("2026-11-07"))).toBe(false);
    expect(validCustomOffer({ ...terms, amount_cents: -1 }, new Date("2026-11-07"))).toBe(false);
  });
  it("uses each offer's own acceptance deadline", () => {
    const offer = { status: "offered", offer_expires_at: terms.offer_expires_at, expires_at: "2027-03-10T00:00:00Z" };
    expect(canPurchaseOffer(offer, new Date("2026-11-20"))).toBe(true);
    expect(canPurchaseOffer(offer, new Date(terms.offer_expires_at))).toBe(false);
  });
});