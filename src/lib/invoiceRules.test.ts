import { describe, it, expect } from "vitest";
import { reverseChargeNote } from "./invoiceRules";

describe("reverseChargeNote", () => {
  it("prints the bilingual note with the buyer NUIS at 0% tax", () => {
    expect(reverseChargeNote(0, "M41901009H")).toBe(
      "Reverse charge: VAT to be accounted for by the recipient (NUIS M41901009H). / Autongarkesë: TVSH llogaritet nga marrësi."
    );
  });
  it("is omitted when tax is charged", () => {
    expect(reverseChargeNote(20, "M41901009H")).toBeNull();
  });
  it("is omitted when the buyer has no tax ID", () => {
    expect(reverseChargeNote(0, "")).toBeNull();
  });
});
