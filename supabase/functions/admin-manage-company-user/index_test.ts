import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { stub } from "https://deno.land/std@0.224.0/testing/mock.ts";

const companyId = "00000000-0000-0000-0000-000000000001";
const userId = "00000000-0000-0000-0000-000000000002";
let handler: ((request: Request) => Promise<Response>) | undefined;
const serveStub = stub(Deno, "serve", ((callback: typeof handler) => {
  handler = callback;
  return {};
}) as typeof Deno.serve);
try {
  await import("./index.ts");
} finally {
  serveStub.restore();
}

async function attempt(options: { applications?: number; listings?: number; paidOffers?: number; fail?: string } = {}) {
  const mutations: string[] = [];
  const reads: string[] = [];
  const env = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY"];
  const original = env.map((key) => Deno.env.get(key));
  Deno.env.set(env[0], "https://deletion-test.invalid");
  Deno.env.set(env[1], "test-service-key");
  Deno.env.set(env[2], "test-anon-key");
  const fetchStub = stub(globalThis, "fetch", (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    const table = url.pathname.split("/").pop() ?? "";
    const method = request.method;
    const jsonResponse = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
      status, headers: { "Content-Type": "application/json" },
    });
    if (url.pathname === "/auth/v1/user") return Promise.resolve(jsonResponse({ id: userId }));
    if (method !== "GET" && method !== "HEAD") {
      mutations.push(`${method} ${table}`);
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    reads.push(table);
    if (table === options.fail) return Promise.resolve(jsonResponse({ message: "lookup failed" }, 400));
    if (method === "HEAD") {
      const count = table === "applications" ? options.applications ?? 0
        : table === "job_listings" ? options.listings ?? 0 : options.paidOffers ?? 0;
      return Promise.resolve(new Response(null, { headers: { "Content-Range": `*/${count}` } }));
    }
    const data = table === "user_roles" ? { id: userId }
      : table === "companies" ? { id: companyId, owner_id: userId }
      : table === "jobs" ? [{ id: "00000000-0000-0000-0000-000000000003" }]
      : table === "invoices" ? [{ id: "invoice", status: "issued", notes: "Original notes" }]
      : table === "client_package_offers" ? [{ id: "offer" }] : [];
    return Promise.resolve(jsonResponse(data));
  });
  try {
    if (!handler) throw new Error("Request handler not registered");
    const response = await handler(new Request("https://deletion-test.invalid", {
      method: "POST", headers: { Authorization: "Bearer test-token", "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_company", company_id: companyId }),
    }));
    return { status: response.status, body: await response.json(), mutations, reads };
  } finally {
    fetchStub.restore();
    env.forEach((key, i) => {
      const value = original[i];
      if (value === undefined) Deno.env.delete(key);
      else Deno.env.set(key, value);
    });
  }
}

Deno.test("company with applications cannot delete or mutate billing", async () => {
  const result = await attempt({ applications: 1 });
  assertEquals(result.status, 400);
  assertStringIncludes(result.body.error, "applications");
  assertEquals(result.mutations, []);
});

Deno.test("company with paid or credited jobs cannot delete or mutate billing", async () => {
  const result = await attempt({ listings: 1 });
  assertEquals(result.status, 400);
  assertStringIncludes(result.body.error, "paid or credited jobs");
  assertEquals(result.mutations, []);
});

Deno.test("company with paid package cannot delete or mutate billing", async () => {
  const result = await attempt({ paidOffers: 1 });
  assertEquals(result.status, 400);
  assertStringIncludes(result.body.error, "paid package");
  assertEquals(result.mutations, []);
});

for (const table of ["client_package_offers", "jobs", "applications", "job_listings"]) {
  Deno.test(`failed ${table} safeguard lookup leaves all data untouched`, async () => {
    const result = await attempt({ fail: table });
    assertEquals(result.status, 500);
    assertEquals(result.mutations, []);
  });
}

Deno.test("unblocked deletion voids invoices and removes offers and company", async () => {
  const result = await attempt();
  assertEquals(result.status, 200);
  assertEquals(result.body.success, true);
  assertEquals(result.reads.includes("applications"), true);
  assertEquals(result.reads.includes("job_listings"), true);
  assertEquals(result.mutations.includes("PATCH invoices"), true);
  assertEquals(result.mutations.includes("DELETE invoices"), false);
  assertEquals(result.mutations.includes("DELETE paypal_orders"), true);
  assertEquals(result.mutations.includes("DELETE client_package_offers"), true);
  assertEquals(result.mutations.includes("DELETE companies"), true);
});