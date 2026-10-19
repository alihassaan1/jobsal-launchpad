import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import JSZip from "npm:jszip@3.10.1";
import { isR2DocumentKey, r2Download, r2SignedGet } from "../_shared/r2.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const BUCKET = "user-documents";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function isAdmin(userId: string) {
  const { data } = await admin.from("user_roles").select("id").eq("user_id", userId).eq("role", "admin").maybeSingle();
  return !!data;
}

/** Can this user access documents attached to this application? */
async function canAccessApplication(userId: string, applicationId: string) {
  const { data: application } = await admin
    .from("applications")
    .select("id, applicant_id, jobs!inner(company_id)")
    .eq("id", applicationId)
    .maybeSingle();
  if (!application) return false;
  if (application.applicant_id === userId) return true;
  if (await isAdmin(userId)) return true;

  const companyId = (application as any).jobs?.company_id;
  if (!companyId) return false;

  const { data: company } = await admin.from("companies").select("owner_id").eq("id", companyId).maybeSingle();
  if (company?.owner_id === userId) return true;

  const { data: member } = await admin
    .from("company_members")
    .select("id")
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!member;
}

async function canAccessDocument(userId: string, documentId: string) {
  const { data: doc } = await admin.from("user_documents").select("*").eq("id", documentId).maybeSingle();
  if (!doc || doc.is_deleted) return null;
  if (doc.user_id === userId) return doc;
  if (await isAdmin(userId)) return doc;

  const { data: links } = await admin
    .from("application_documents")
    .select("application_id")
    .eq("document_id", documentId);
  for (const link of links || []) {
    if (await canAccessApplication(userId, link.application_id)) return doc;
  }
  return null;
}

function base64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
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
    const action = body?.action;

    if (action === "document_url") {
      const documentId = typeof body?.documentId === "string" ? body.documentId : null;
      if (!documentId) return json({ error: "documentId is required" }, 400);

      const doc = await canAccessDocument(userId, documentId);
      if (!doc) return json({ error: "Not authorized for this document" }, 403);

      if (isR2DocumentKey(doc.file_path)) {
        return json({ url: await r2SignedGet(doc.file_path, body?.download ? doc.file_name : undefined) });
      }
      const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(doc.file_path, 120, {
        download: body?.download ? doc.file_name : undefined,
      });
      if (error || !data?.signedUrl) return json({ error: error?.message || "File unavailable" }, 404);
      return json({ url: data.signedUrl });
    }

    if (action === "zip") {
      const applicationId = typeof body?.applicationId === "string" ? body.applicationId : null;
      if (!applicationId) return json({ error: "applicationId is required" }, 400);

      if (!(await canAccessApplication(userId, applicationId))) {
        return json({ error: "Not authorized for this application" }, 403);
      }

      const { data: links, error: linkError } = await admin
        .from("application_documents")
        .select("user_documents(*)")
        .eq("application_id", applicationId);
      if (linkError) throw linkError;

      const documents = (links || []).map((l: any) => l.user_documents).filter(Boolean);
      if (documents.length === 0) return json({ error: "No documents attached" }, 404);

      const zip = new JSZip();
      const used = new Set<string>();
      for (const doc of documents) {
        let bytes: Uint8Array | null = null;
        if (isR2DocumentKey(doc.file_path)) bytes = await r2Download(doc.file_path);
        else {
          const { data: file } = await admin.storage.from(BUCKET).download(doc.file_path);
          if (file) bytes = new Uint8Array(await file.arrayBuffer());
        }
        if (!bytes) continue;
        const ext = doc.file_name.includes(".") ? `.${doc.file_name.split(".").pop()}` : "";
        const base = `${doc.doc_type}-${(doc.title || doc.file_name).replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "document"}`;
        let name = `${base}${ext}`;
        let i = 2;
        while (used.has(name)) name = `${base} (${i++})${ext}`;
        used.add(name);
        zip.file(name, bytes);
      }

      const content: Uint8Array = await zip.generateAsync({ type: "uint8array" });
      return json({ zip: base64(content), fileName: `application-${applicationId.slice(0, 8)}-documents.zip` });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("document-access error:", error);
    return json({ error: (error as Error).message }, 500);
  }
});
