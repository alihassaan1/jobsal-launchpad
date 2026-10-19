import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { AwsClient } from "npm:aws4fetch@1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID");
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY");
const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID");
const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME");

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ACCOUNT_ID || !R2_BUCKET_NAME) {
      return json({ error: "R2 is not configured" }, 500);
    }

    // Authorization: one-time migration token (stored in admin_settings), service role key,
    // or a user JWT with the admin role.
    const authHeader = req.headers.get("Authorization") ?? "";
    const migrationToken = req.headers.get("x-migration-token") ?? "";

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    let authorized = authHeader === `Bearer ${SERVICE_ROLE_KEY}`;

    if (!authorized && migrationToken) {
      const { data: tokenRow } = await admin
        .from("admin_settings")
        .select("value")
        .eq("key", "r2_migration_token")
        .maybeSingle();
      authorized = !!tokenRow?.value && tokenRow.value === migrationToken;
    }

    if (!authorized) {
      if (!authHeader) return json({ error: "Unauthorized" }, 401);
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: userError } = await userClient.auth.getUser();
      if (userError || !userData?.user) return json({ error: "Unauthorized" }, 401);

      const { data: roleRow } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleRow) return json({ error: "Admins only" }, 403);
    }

    const r2 = new AwsClient({
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      service: "s3",
      region: "auto",
    });
    // R2_ACCOUNT_ID may be the bare account ID or the full endpoint URL — normalize it.
    const account = R2_ACCOUNT_ID!.replace(/^https?:\/\//, "")
      .replace(/\.r2\.cloudflarestorage\.com\/?$/, "")
      .replace(/\/$/, "");
    const r2Url = (key: string) =>
      `https://${account}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`;

    // Fetch all resumes (paginated past the 1000-row default).
    const rows: any[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await admin
        .from("resumes")
        .select("id, user_id, resume_file_url")
        .range(from, from + 999);
      if (error) throw error;
      if (!data || data.length === 0) break;
      rows.push(...data);
      if (data.length < 1000) break;
      from += 1000;
    }

    const report = { total: rows.length, migrated: 0, skipped: 0, failed: [] as any[] };

    for (const row of rows) {
      const stored = row.resume_file_url as string | null;
      if (!stored) {
        report.skipped++;
        continue;
      }
      // Already an R2 key (resumes/<userId>/...) — nothing to do.
      if (stored.startsWith("resumes/")) {
        report.skipped++;
        continue;
      }

      // Legacy formats: a plain "<userId>/<file>" path, or a full Supabase storage URL
      // (.../object/public/resumes/<userId>/<file>).
      let legacyPath = stored;
      if (stored.startsWith("http")) {
        const marker = "/resumes/";
        const idx = stored.indexOf(marker);
        if (idx === -1) {
          report.failed.push({ id: row.id, path: stored, error: "unrecognized URL format" });
          continue;
        }
        legacyPath = stored.slice(idx + marker.length);
      }
      const newKey = `resumes/${legacyPath}`;

      try {
        const { data: file, error: dlError } = await admin.storage
          .from("resumes")
          .download(legacyPath);
        if (dlError || !file) {
          report.failed.push({ id: row.id, path: legacyPath, error: dlError?.message || "download failed" });
          continue;
        }

        const bytes = new Uint8Array(await file.arrayBuffer());
        const ext = legacyPath.split(".").pop()?.toLowerCase() ?? "pdf";
        const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

        const putResp = await r2.fetch(r2Url(newKey), {
          method: "PUT",
          headers: { "Content-Type": contentType },
          body: bytes,
        });
        if (!putResp.ok) {
          report.failed.push({ id: row.id, path: legacyPath, error: `R2 PUT ${putResp.status}` });
          continue;
        }

        const { error: upError } = await admin
          .from("resumes")
          .update({ resume_file_url: newKey })
          .eq("id", row.id);
        if (upError) {
          report.failed.push({ id: row.id, path: legacyPath, error: upError.message });
          continue;
        }

        report.migrated++;
      } catch (e) {
        report.failed.push({ id: row.id, path: legacyPath, error: (e as Error).message });
      }
    }

    return json(report);
  } catch (error) {
    console.error("migrate-resumes-to-r2 error:", error);
    return json({ error: (error as Error).message }, 500);
  }
});
