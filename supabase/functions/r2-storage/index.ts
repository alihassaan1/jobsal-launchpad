import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { AwsClient } from "npm:aws4fetch@1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID");
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY");
const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID");
const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME");
const R2_PUBLIC_URL = (Deno.env.get("R2_PUBLIC_URL") || "").replace(/\/$/, "");

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const RESUME_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const DOCUMENT_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};
// Each user document type gets its own folder: documents/{folder}/{userId}/...
const DOCUMENT_FOLDERS: Record<string, string> = {
  certification: "certificates",
  cover_letter: "cover-letters",
  experience_letter: "experience-letters",
  thumbnail: "thumbnails",
};
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
// Public image subfolders under images/ — keeps each file type in its own folder.
const IMAGE_FOLDERS = new Set(["blog", "logos", "banners", "ads", "jobs", "templates", "misc"]);

function r2Client() {
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ACCOUNT_ID || !R2_BUCKET_NAME) {
    throw new Error("R2 storage is not configured");
  }
  return new AwsClient({
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    service: "s3",
    region: "auto",
  });
}

// R2_ACCOUNT_ID may be stored as the bare account ID or the full endpoint URL — normalize it.
const R2_ACCOUNT = (R2_ACCOUNT_ID || "")
  .replace(/^https?:\/\//, "")
  .replace(/\.r2\.cloudflarestorage\.com\/?$/, "")
  .replace(/\/$/, "");

function objectUrl(key: string) {
  return `https://${R2_ACCOUNT}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`;
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
    const action = typeof body?.action === "string" ? body.action : null;
    const aws = r2Client();

    const isAdminUser = async () => {
      const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
      const { data } = await admin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
      return !!data;
    };
    // documents/{folder}/{ownerId}/file
    const documentOwner = (key: string) => key.split("/")[2];

    if (action === "presign_put" && body?.kind === "document") {
      const folder = DOCUMENT_FOLDERS[body?.docType];
      const contentType = typeof body?.contentType === "string" ? body.contentType : "";
      const size = Number(body?.size) || 0;
      const ext = DOCUMENT_TYPES[contentType];
      if (!folder) return json({ error: "Invalid document type" }, 400);
      if (!ext) return json({ error: "Only PDF, JPG and PNG files are allowed" }, 400);
      if (size <= 0 || size > MAX_DOCUMENT_BYTES) return json({ error: "File is too large" }, 400);
      const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
      const key = `documents/${folder}/${userId}/${Date.now()}-${rand}.${ext}`;
      const signed = await aws.sign(objectUrl(key), {
        method: "PUT",
        aws: { signQuery: true, allHeaders: true },
        headers: { "Content-Type": contentType },
      });
      return json({ uploadUrl: signed.url, key });
    }

    if (action === "delete") {
      const keys: string[] = Array.isArray(body?.keys) ? body.keys.filter((k: unknown) => typeof k === "string") : [];
      const valid = keys.filter((k) => k.startsWith("documents/") && !k.includes(".."));
      if (!valid.length) return json({ error: "No valid files" }, 400);
      const admin = valid.some((k) => documentOwner(k) !== userId) ? await isAdminUser() : true;
      if (!admin) return json({ error: "Not authorized for this file" }, 403);
      await Promise.all(valid.map((k) => aws.fetch(objectUrl(k), { method: "DELETE" })));
      return json({ deleted: valid.length });
    }

    if (action === "presign_put") {
      const kind = body?.kind === "image" ? "image" : "resume";
      const contentType = typeof body?.contentType === "string" ? body.contentType : "";
      const size = Number(body?.size) || 0;

      const typeMap = kind === "image" ? IMAGE_TYPES : RESUME_TYPES;
      const maxBytes = kind === "image" ? MAX_IMAGE_BYTES : MAX_RESUME_BYTES;
      const ext = typeMap[contentType];
      if (!ext) {
        return json({
          error: kind === "image"
            ? "Only JPG, PNG and WebP images are allowed"
            : "Only PDF or Word documents are allowed",
        }, 400);
      }
      if (size <= 0 || size > maxBytes) {
        return json({ error: `File must be between 1 byte and ${maxBytes / 1024 / 1024}MB` }, 400);
      }

      const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
      const folder = IMAGE_FOLDERS.has(body?.folder) ? `${body.folder}/` : "";
      const key = kind === "image"
        ? `images/${folder}${Date.now()}-${rand}.${ext}`
        : `resumes/${userId}/${Date.now()}.${ext}`;

      const signed = await aws.sign(objectUrl(key), {
        method: "PUT",
        aws: { signQuery: true, allHeaders: true },
        headers: { "Content-Type": contentType },
      });

      return json({
        uploadUrl: signed.url,
        key,
        publicUrl: kind === "image" && R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : null,
      });
    }

    if (action === "presign_get") {
      const key = typeof body?.key === "string" ? body.key : "";
      if (!key || key.includes("..")) return json({ error: "Invalid file reference" }, 400);

      // Resume files are private: only the owner or an admin may open them.
      if (key.startsWith("resumes/")) {
        const isOwner = key.startsWith(`resumes/${userId}/`);
        let isAdmin = false;
        if (!isOwner) {
          const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
          const { data: roleRow } = await admin
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .eq("role", "admin")
            .maybeSingle();
          isAdmin = !!roleRow;
          // Employers may open resumes of candidates who applied to their company's jobs.
          if (!isAdmin) {
            const applicantId = key.split("/")[1];
            const { data: apps } = await admin
              .from("applications")
              .select("jobs!inner(company_id)")
              .eq("applicant_id", applicantId);
            const companyIds = [...new Set((apps || []).map((a: any) => a.jobs?.company_id).filter(Boolean))];
            if (companyIds.length) {
              const { data: owned } = await admin.from("companies").select("id").in("id", companyIds).eq("owner_id", userId).limit(1);
              const { data: member } = await admin.from("company_members").select("id").in("company_id", companyIds).eq("user_id", userId).limit(1);
              isAdmin = !!(owned?.length || member?.length);
            }
          }
        }
        if (!isOwner && !isAdmin) return json({ error: "Not authorized for this file" }, 403);

        const download = body?.download === true;
        const url = new URL(objectUrl(key));
        if (download) url.searchParams.set("response-content-disposition", "attachment");
        const signed = await aws.sign(url.toString(), {
          method: "GET",
          aws: { signQuery: true },
        });
        return json({ url: signed.url });
      }

      // Private user documents: owner or admin only (employers use document-access).
      if (key.startsWith("documents/")) {
        if (documentOwner(key) !== userId && !(await isAdminUser())) {
          return json({ error: "Not authorized for this file" }, 403);
        }
        const url = new URL(objectUrl(key));
        url.searchParams.set("X-Amz-Expires", "120");
        if (body?.download === true) url.searchParams.set("response-content-disposition", "attachment");
        const signed = await aws.sign(url.toString(), { method: "GET", aws: { signQuery: true } });
        return json({ url: signed.url });
      }

      return json({ error: "Unsupported file reference" }, 400);
    }

    if (action === "put_image") {
      // Server-side image upload (used by content generators): accepts a base64 payload.
      const contentType = typeof body?.contentType === "string" ? body.contentType : "";
      const ext = IMAGE_TYPES[contentType];
      const base64 = typeof body?.data === "string" ? body.data : "";
      if (!ext || !base64) return json({ error: "Invalid image payload" }, 400);

      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) {
        return json({ error: "Image size out of range" }, 400);
      }

      const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
      const key = `images/${Date.now()}-${rand}.${ext}`;
      const resp = await aws.fetch(objectUrl(key), {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: bytes,
      });
      if (!resp.ok) {
        const text = await resp.text();
        console.error("R2 put failed:", resp.status, text);
        return json({ error: "Upload to storage failed", status: resp.status }, 502);
      }
      return json({ key, publicUrl: R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : null });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("r2-storage error:", error);
    return json({ error: (error as Error).message }, 500);
  }
});
