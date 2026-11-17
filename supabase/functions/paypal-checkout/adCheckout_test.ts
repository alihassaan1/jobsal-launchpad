import { assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { allocateDiscount } from "./adCheckout.ts";

Deno.test("ad discount never exceeds the order subtotal", () => {
  assertEquals(allocateDiscount([2500, 4500], 10000), [2500, 4500]);
});

Deno.test("ad discount allocations add up to the exact discount", () => {
  const shares = allocateDiscount([2500, 4500, 6900], 1000);
  assertEquals(shares.reduce((sum, share) => sum + share, 0), 1000);
  assertEquals(shares.every((share, index) => share >= 0 && share <= [2500, 4500, 6900][index]), true);
});

Deno.test("each ad keeps a non-negative payable amount", () => {
  const prices = [100, 100, 100];
  const shares = allocateDiscount(prices, 150);
  assertEquals(prices.map((price, index) => price - shares[index]), [50, 50, 50]);
});
