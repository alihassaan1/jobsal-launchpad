import { describe, it, expect } from "vitest";
import { LISTING_OPTIONS, MONTHLY_PACKAGES, URGENT_ADDON, approxLek, eur, LEK_PER_EUR } from "./pricingConfig";

describe("pricingConfig", () => {
  it("shows exactly three per-job options: Standard, Featured, Premium", () => {
    expect(LISTING_OPTIONS.map((o) => o.name)).toEqual(["Standard", "Featured", "Premium"]);
  });

  it("marks Featured as the recommended per-job option", () => {
    expect(LISTING_OPTIONS.find((o) => o.name === "Featured")?.recommended).toBe(true);
    expect(LISTING_OPTIONS.filter((o) => o.recommended)).toHaveLength(1);
  });

  it("does not offer the Extra promotion product on the pricing page", () => {
    const all = [...LISTING_OPTIONS, ...MONTHLY_PACKAGES].map((o) => o.key);
    expect(all).not.toContain("extra_promotion");
  });

  it("keeps the urgent hiring add-on at €79", () => {
    expect(URGENT_ADDON.amount_cents).toBe(7900);
  });

  it("shows three monthly packages with Business recommended", () => {
    expect(MONTHLY_PACKAGES.map((p) => p.name)).toEqual(["Starter", "Business", "Corporate"]);
    expect(MONTHLY_PACKAGES.find((p) => p.name === "Business")?.recommended).toBe(true);
  });

  it("formats euro and approximate lek amounts", () => {
    expect(eur(1900)).toBe("€19.00");
    expect(approxLek(1900)).toBe(`≈ ${(19 * LEK_PER_EUR).toLocaleString()} L`);
  });
});
