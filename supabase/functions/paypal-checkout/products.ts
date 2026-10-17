// Single source of truth for PayPal-sellable employer products (EUR cents).
export type PaypalProduct = {
  key: string;
  name: string;
  amount_cents: number;
  listing_credits: number;
  featured_days: number;
  kind: "listing" | "subscription" | "client_package";
  duration_months?: number;
  plan_slug?: string;
};

export const PAYPAL_PRODUCTS: Record<string, PaypalProduct> = {
  standard_listing: { key: "standard_listing", name: "Standard job listing (30 days)", amount_cents: 1900, listing_credits: 1, featured_days: 0, kind: "listing" },
  featured_job: { key: "featured_job", name: "Featured job (30 days + 14 days featured)", amount_cents: 3900, listing_credits: 1, featured_days: 14, kind: "listing" },
  premium_job: { key: "premium_job", name: "Premium job (30 days featured)", amount_cents: 5900, listing_credits: 1, featured_days: 30, kind: "listing" },
  urgent_hiring: { key: "urgent_hiring", name: "Urgent hiring promotion", amount_cents: 7900, listing_credits: 1, featured_days: 30, kind: "listing" },
  extra_promotion: { key: "extra_promotion", name: "Extra promotion", amount_cents: 1500, listing_credits: 0, featured_days: 0, kind: "listing" },
  starter_monthly: { key: "starter_monthly", name: "Starter package (monthly)", amount_cents: 4900, listing_credits: 5, featured_days: 0, kind: "subscription", plan_slug: "starter" },
  business_monthly: { key: "business_monthly", name: "Business package (monthly)", amount_cents: 8900, listing_credits: 10, featured_days: 0, kind: "subscription", plan_slug: "business" },
  corporate_monthly: { key: "corporate_monthly", name: "Corporate package (monthly)", amount_cents: 14900, listing_credits: 20, featured_days: 0, kind: "subscription", plan_slug: "corporate" },
  enterprise_monthly: { key: "enterprise_monthly", name: "Enterprise package (monthly, from)", amount_cents: 24900, listing_credits: 40, featured_days: 0, kind: "subscription", plan_slug: "enterprise" },
  tia_pilot: { key: "tia_pilot", name: "Pilot", amount_cents: 25000, listing_credits: 10, featured_days: 0, kind: "client_package", duration_months: 3 },
  tia_standard: { key: "tia_standard", name: "Standard", amount_cents: 60000, listing_credits: 30, featured_days: 0, kind: "client_package", duration_months: 6 },
  tia_annual: { key: "tia_annual", name: "Annual", amount_cents: 120000, listing_credits: 80, featured_days: 0, kind: "client_package", duration_months: 12 },
};

export const formatEur = (cents: number) => (cents / 100).toFixed(2);
