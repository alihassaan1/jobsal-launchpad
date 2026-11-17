import { assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { isWelcomeEligible } from "./welcomeEligibility.ts";

Deno.test("welcome queue includes a signup exactly seven days old", () => {
  const now = new Date("2026-11-17T08:00:00.000Z");
  assertEquals(isWelcomeEligible("2026-11-10T08:00:00.000Z", now), true);
});

Deno.test("welcome queue excludes signups older than seven days", () => {
  const now = new Date("2026-11-17T08:00:00.000Z");
  assertEquals(isWelcomeEligible("2026-11-10T07:59:59.000Z", now), false);
});
