import { assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { requireAdmin, requireInternal } from "./auth.ts";

Deno.test("admin endpoint rejects missing authorization with 401", async () => {
  const result = await requireAdmin(new Request("https://jobs.al"));
  assertEquals(result.ok, false);
  if (!result.ok) assertEquals(result.response.status, 401);
});

Deno.test("internal endpoint rejects public bearer and incorrect secret", () => {
  const result = requireInternal(new Request("https://jobs.al", { headers: {
    Authorization: "Bearer public-invalid", "x-internal-secret": "incorrect",
  } }));
  assertEquals(result.ok, false);
  if (!result.ok) assertEquals(result.response.status, 401);
});

Deno.test("internal endpoint accepts configured internal secret", () => {
  const previous = Deno.env.get("INTERNAL_CRON_SECRET");
  Deno.env.set("INTERNAL_CRON_SECRET", "test-only-internal-credential");
  try {
    assertEquals(requireInternal(new Request("https://jobs.al", { headers: {
      "x-internal-secret": "test-only-internal-credential",
    } })).ok, true);
  } finally {
    if (previous === undefined) Deno.env.delete("INTERNAL_CRON_SECRET");
    else Deno.env.set("INTERNAL_CRON_SECRET", previous);
  }
});