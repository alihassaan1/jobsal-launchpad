// Shared invoice rules. Mirrored in supabase/functions/generate-invoice-pdf/index.ts.
export const INVOICE_SELLER = {
  name: "iMake LLC",
  tagline: "Operator of Jobs.al",
  address: ["5900 Balcones Drive STE 100", "Austin, TX 78731", "USA"],
  email: "info@jobs.al",
};

export function reverseChargeNote(taxRate: number | null | undefined, buyerTaxId: string | null | undefined): string | null {
  const id = (buyerTaxId ?? "").trim();
  if (Number(taxRate ?? 0) !== 0 || !id) return null;
  return `Reverse charge: VAT to be accounted for by the recipient (NUIS ${id}). / Autongarkesë: TVSH llogaritet nga marrësi.`;
}
