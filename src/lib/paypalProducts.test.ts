import { describe, it, expect } from "vitest";
import { PAYPAL_PRODUCTS } from "../../supabase/functions/paypal-checkout/products";

describe("PayPal employer prices", () => {
  it("standard listing is €19", () => expect(PAYPAL_PRODUCTS.standard_listing.amount_cents).toBe(1900));
  it("featured job is €39 with 14 featured days", () => {
    expect(PAYPAL_PRODUCTS.featured_job.amount_cents).toBe(3900);
    expect(PAYPAL_PRODUCTS.featured_job.featured_days).toBe(14);
  });
  it("premium job is €59", () => expect(PAYPAL_PRODUCTS.premium_job.amount_cents).toBe(5900));
  it("urgent hiring is €79", () => expect(PAYPAL_PRODUCTS.urgent_hiring.amount_cents).toBe(7900));
  it("extra promotion is €15", () => expect(PAYPAL_PRODUCTS.extra_promotion.amount_cents).toBe(1500));
  it("Starter is €49 for 5 listings", () => {
    expect(PAYPAL_PRODUCTS.starter_monthly.amount_cents).toBe(4900);
    expect(PAYPAL_PRODUCTS.starter_monthly.listing_credits).toBe(5);
  });
  it("Business is €89 for 10 listings", () => expect(PAYPAL_PRODUCTS.business_monthly.listing_credits).toBe(10));
  it("Corporate is €149 for 20 listings", () => expect(PAYPAL_PRODUCTS.corporate_monthly.amount_cents).toBe(14900));
  it("Enterprise starts at €249 for 40 listings", () => {
    expect(PAYPAL_PRODUCTS.enterprise_monthly.amount_cents).toBe(24900);
    expect(PAYPAL_PRODUCTS.enterprise_monthly.listing_credits).toBe(40);
  });
});
