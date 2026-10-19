import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { isR2DocumentKey, r2Delete, r2Download } from "../_shared/r2.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const BUCKET = "user-documents";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/** Detect real file type from magic bytes and do a light corruption check. */
function detect(bytes: Uint8Array): { type: string | null; corrupted: boolean } {
  const startsWith = (sig: number[]) => sig.every((b, i) => bytes[i] === b);

  if (startsWith([0x25, 0x50, 0x44, 0x46])) {
    // PDF must contain an EOF marker somewhere near the end
    const tail = new TextDecoder().decode(bytes.slice(Math.max(0, bytes.length - 2048)));
    return { type: "application/pdf", corrupted: !tail.includes("%%EOF") };
  }
  if (startsWith([0xff, 0xd8, 0xff])) {
    const corrupted = !(bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9);
    return { type: "image/jpeg", corrupted };
  }
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    const tail = bytes.slice(Math.max(0, bytes.length - 8));
    const iend = [0x49, 0x45, 0x4e, 0x44];
    const corrupted = !iend.every((b, i) => tail[i] === b);
    return { type: "image/png", corrupted };
  }
  return { type: null, corrupted: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const documentId = typeof body?.documentId === "string" ? body.documentId : null;
    // When replacing an existing document the caller keeps ownership of the row and
    // restores the previous metadata itself, so we must not delete it here.
    const keepRecord = body?.keepRecord === true;
    if (!documentId) return json({ error: "documentId is required" }, 400);


    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: doc, error: docError } = await admin
      .from("user_documents")
      .select("*")
      .eq("id", documentId)
      .maybeSingle();
    if (docError) throw docError;
    if (!doc || doc.user_id !== userId) return json({ error: "Document not found" }, 404);

    // Settings-driven limits (server-side enforcement)
    const { data: settingsRows } = await admin
      .from("admin_settings")
      .select("key, value")
      .like("key", "documents_%");
    const settings: Record<string, string> = {};
    (settingsRows || []).forEach((r: any) => {
      if (r.value != null) settings[r.key] = r.value;
    });
    const enabled = (settings.documents_enabled ?? "true") === "true";
    const maxSizeMb = Number(settings.documents_max_size_mb ?? 5) || 5;
    const maxPerUser = Number(settings.documents_max_per_user ?? 10) || 10;

    const fail = async (message: string) => {
      const paths = [doc.file_path, doc.thumbnail_path].filter(Boolean) as string[];
      const r2Keys = paths.filter(isR2DocumentKey);
      const legacy = paths.filter((k) => !isR2DocumentKey(k));
      if (r2Keys.length) await r2Delete(r2Keys);
      if (legacy.length) await admin.storage.from(BUCKET).remove(legacy);
      if (!keepRecord) {
        await admin.from("user_documents").delete().eq("id", documentId);
      } else {
        await admin.from("user_documents").update({ is_verified: false, verification_error: message }).eq("id", documentId);
      }
      return json({ valid: false, error: message }, 200);
    };


    if (!enabled) return await fail("Document uploads are currently disabled");

    const { count } = await admin
      .from("user_documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_deleted", false);
    if ((count ?? 0) > maxPerUser) {
      return await fail(`You can store a maximum of ${maxPerUser} documents`);
    }

    let buffer: Uint8Array | null = null;
    if (isR2DocumentKey(doc.file_path)) {
      buffer = await r2Download(doc.file_path);
    } else {
      const { data: file } = await admin.storage.from(BUCKET).download(doc.file_path);
      if (file) buffer = new Uint8Array(await file.arrayBuffer());
    }
    if (!buffer) return await fail("Uploaded file could not be read");
    if (buffer.length === 0) return await fail("Uploaded file is empty");
    if (buffer.length > maxSizeMb * 1024 * 1024) {
      return await fail(`File exceeds the ${maxSizeMb}MB limit`);
    }

    const { type, corrupted } = detect(buffer);
    if (!type) return await fail("Only PDF, JPG and PNG files are allowed");
    if (corrupted) return await fail("The file appears to be corrupted. Please re-upload it.");

    await admin
      .from("user_documents")
      .update({ is_verified: true, verification_error: null, mime_type: type, file_size: buffer.length })
      .eq("id", documentId);

    return json({ valid: true, mimeType: type });
  } catch (error) {
    console.error("validate-document error:", error);
    return json({ error: (error as Error).message }, 500);
  }
});
