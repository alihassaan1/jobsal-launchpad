// Single source of truth for employer-facing prices on the website.
// Amounts come from the PayPal product catalog (EUR cents) — change prices there.
import { PAYPAL_PRODUCTS, formatEur, type PaypalProduct } from "../../supabase/functions/paypal-checkout/products";

// Approximate exchange rate for display only (PayPal charges in EUR).
export const LEK_PER_EUR = 100;

export const approxLek = (cents: number) =>
  `≈ ${Math.round((cents / 100) * LEK_PER_EUR).toLocaleString()} L`;

export const eur = (cents: number) => `€${formatEur(cents)}`;

export type ListingOption = PaypalProduct & { recommended?: boolean };

// Per-job visibility options shown on /pricing and the post-job checkout.
export const LISTING_OPTIONS: ListingOption[] = [
  { ...PAYPAL_PRODUCTS.standard_listing, name: "Standard" },
  { ...PAYPAL_PRODUCTS.featured_job, name: "Featured", recommended: true },
  { ...PAYPAL_PRODUCTS.premium_job, name: "Premium" },
];

export const URGENT_ADDON = PAYPAL_PRODUCTS.urgent_hiring; // €79 optional add-on

// Monthly packages shown on /pricing.
export const MONTHLY_PACKAGES: (PaypalProduct & { recommended?: boolean })[] = [
  { ...PAYPAL_PRODUCTS.starter_monthly, name: "Starter" },
  { ...PAYPAL_PRODUCTS.business_monthly, name: "Business", recommended: true },
  { ...PAYPAL_PRODUCTS.corporate_monthly, name: "Corporate" },
];

// Corporate packages: shown on /pricing, sold by quote and contract only (no online checkout).
export const CORPORATE_PACKAGES = [
  { ...PAYPAL_PRODUCTS.corp_pilot, label: { en: "Pilot", sq: "Pilot" }, value_cents: 22500, savePct: 0, bestValue: false },
  { ...PAYPAL_PRODUCTS.corp_standard, label: { en: "Standard", sq: "Standard" }, value_cents: 67500, savePct: 0, bestValue: false },
  { ...PAYPAL_PRODUCTS.corp_annual, label: { en: "Annual", sq: "Vjetore" }, value_cents: 180000, savePct: 33, bestValue: true },
];

export const VAT_NOTE = {
  en: "Prices exclude VAT where applicable",
  sq: "Çmimet nuk përfshijnë TVSH-në ku aplikohet",
};

export const PAYPAL_NOTE = {
  en: "Secure payment by PayPal. You can pay by card without a PayPal account",
  sq: "Pagesë e sigurt me PayPal. Mund të paguani me kartë pa llogari PayPal",
};
