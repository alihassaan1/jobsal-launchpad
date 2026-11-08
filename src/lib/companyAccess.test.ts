import { describe, expect, it } from "vitest";
import { canCreateOfferCompany } from "../../supabase/functions/paypal-checkout/companyAccess";

describe("Company creation for private employer packages", () => {
  it("allows only an admin to create a company for an employer account", () => {
    expect(canCreateOfferCompany([{ role: "admin" }], [{ role: "employer" }])).toBe(true);
    expect(canCreateOfferCompany([{ role: "employer" }], [{ role: "employer" }])).toBe(false);
    expect(canCreateOfferCompany([], [{ role: "employer" }])).toBe(false);
  });
  it("does not assign a client company to a job seeker or admin-only owner", () => {
    expect(canCreateOfferCompany([{ role: "admin" }], [{ role: "job_seeker" }])).toBe(false);
    expect(canCreateOfferCompany([{ role: "admin" }], [{ role: "admin" }])).toBe(false);
    expect(canCreateOfferCompany([{ role: "admin" }], [])).toBe(false);
  });
});