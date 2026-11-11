import { describe, it, expect } from "vitest";
import { PAYPAL_PRODUCTS } from "../../supabase/functions/paypal-checkout/products";

describe("PayPal employer prices", () => {
  it("standard listing is €25", () => expect(PAYPAL_PRODUCTS.standard_listing.amount_cents).toBe(2500));
  it("featured job is €45 with 14 featured days", () => {
    expect(PAYPAL_PRODUCTS.featured_job.amount_cents).toBe(4500);
    expect(PAYPAL_PRODUCTS.featured_job.featured_days).toBe(14);
  });
  it("premium job is €69", () => expect(PAYPAL_PRODUCTS.premium_job.amount_cents).toBe(6900));
  it("urgent hiring is €79", () => expect(PAYPAL_PRODUCTS.urgent_hiring.amount_cents).toBe(7900));
  it("extra promotion is €15", () => expect(PAYPAL_PRODUCTS.extra_promotion.amount_cents).toBe(1500));
  it("Starter is €79 for 5 listings", () => {
    expect(PAYPAL_PRODUCTS.starter_monthly.amount_cents).toBe(7900);
    expect(PAYPAL_PRODUCTS.starter_monthly.listing_credits).toBe(5);
  });
  it("Business is €139 for 10 listings", () => expect(PAYPAL_PRODUCTS.business_monthly.listing_credits).toBe(10));
  it("Corporate is €229 for 20 listings", () => expect(PAYPAL_PRODUCTS.corporate_monthly.amount_cents).toBe(22900));
  it("Enterprise starts at €249 for 40 listings", () => {
    expect(PAYPAL_PRODUCTS.enterprise_monthly.amount_cents).toBe(24900);
    expect(PAYPAL_PRODUCTS.enterprise_monthly.listing_credits).toBe(40);
  });
  it("Starter is charged €79 and Business €139", () => {
    expect(PAYPAL_PRODUCTS.starter_monthly.amount_cents).toBe(7900);
    expect(PAYPAL_PRODUCTS.business_monthly.amount_cents).toBe(13900);
  });
  it("corporate packages: Pilot €200/5, Standard €550/15, Annual €1200/40 Featured postings", () => {
    expect([PAYPAL_PRODUCTS.corp_pilot, PAYPAL_PRODUCTS.corp_standard, PAYPAL_PRODUCTS.corp_annual].map(p => [p.amount_cents, p.listing_credits, p.duration_months, p.featured_days]))
      .toEqual([[20000, 5, 3, 14], [55000, 15, 6, 14], [120000, 40, 12, 14]]);
  });
});
