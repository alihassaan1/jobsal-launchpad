import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const Body = z.object({
  kind: z.enum(["job", "company"]),
  id: z.string().uuid(),
});

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

async function visitorHash(req: Request, kind: string, id: string, bucket: number): Promise<string> {
  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const agent = (req.headers.get("user-agent") || "unknown").slice(0, 300);
  const source = new TextEncoder().encode(`${ip}|${agent}|${kind}|${id}|${bucket}`);
  const digest = await crypto.subtle.digest("SHA-256", source);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: "Invalid page" }, 400);
    const { kind, id } = parsed.data;
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: page, error: pageError } = await admin.from(kind === "job" ? "jobs" : "companies")
      .select("id").eq("id", id).maybeSingle();
    if (pageError || !page) return json({ counted: false });

    // One count per visitor/page in a 30-minute window. Only a keyed hash is stored,
    // never the IP address or user agent. Repeated calls cannot inflate the counter.
    const bucket = Math.floor(Date.now() / (30 * 60 * 1000));
    const hash = await visitorHash(req, kind, id, bucket);
    const { error: receiptError } = await admin.from("page_view_receipts").insert({
      content_type: kind,
      content_id: id,
      visitor_hash: hash,
      bucket,
    });
    if (receiptError?.code === "23505") return json({ counted: false });
    if (receiptError) throw receiptError;

    const rpc = kind === "job" ? "increment_job_views" : "increment_company_views";
    const args = kind === "job" ? { job_id: id } : { company_id: id };
    const { error: incrementError } = await admin.rpc(rpc, args);
    if (incrementError) throw incrementError;
    return json({ counted: true });
  } catch (error) {
    console.error("Page view failed", error instanceof Error ? error.message : "unknown error");
    return json({ counted: false }, 500);
  }
});
