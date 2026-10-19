import { supabase } from "@/integrations/supabase/client";

export type DocType = "certification" | "cover_letter" | "experience_letter";

export const DOC_TYPES: { value: DocType; label: string }[] = [
  { value: "certification", label: "Certification" },
  { value: "cover_letter", label: "Cover Letter" },
  { value: "experience_letter", label: "Experience Letter" },
];

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  certification: "Certification",
  cover_letter: "Cover Letter",
  experience_letter: "Experience Letter",
};

export const DOCUMENTS_BUCKET = "user-documents";

export const ACCEPTED_MIME = ["application/pdf", "image/jpeg", "image/png"];
export const ACCEPTED_EXT = ".pdf,.jpg,.jpeg,.png";

export function formatBytes(bytes: number) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function extensionFor(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && ["pdf", "jpg", "jpeg", "png"].includes(ext)) return ext;
  return file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
}

/** Client-side thumbnail generation for image uploads (max 320px). */
export async function makeImageThumbnail(file: File): Promise<Blob | null> {
  if (!file.type.startsWith("image/")) return null;
  try {
    const bitmapUrl = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = bitmapUrl;
    });
    const max = 320;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(bitmapUrl);
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", 0.75));
  } catch {
    return null;
  }
}

/** New documents live in Cloudflare R2 under documents/{type}/{userId}/; older ones in the legacy bucket. */
export const isR2DocumentKey = (path?: string | null) => !!path && path.startsWith("documents/");

/** Uploads a document (or its thumbnail) straight to R2 and returns the stored key. */
export async function uploadDocumentToR2(
  file: Blob,
  contentType: string,
  docType: DocType | "thumbnail",
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("r2-storage", {
    body: { action: "presign_put", kind: "document", docType, contentType, size: file.size },
  });
  if (error || !data?.uploadUrl) throw new Error(data?.error || error?.message || "Upload failed");
  const put = await fetch(data.uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
  if (!put.ok) throw new Error(`Upload failed (${put.status})`);
  return data.key as string;
}

/** Deletes document files from R2 and/or the legacy bucket. */
export async function removeDocumentFiles(paths: (string | null | undefined)[]) {
  const all = paths.filter(Boolean) as string[];
  const r2 = all.filter(isR2DocumentKey);
  const legacy = all.filter((p) => !isR2DocumentKey(p));
  if (r2.length) await supabase.functions.invoke("r2-storage", { body: { action: "delete", keys: r2 } });
  if (legacy.length) await supabase.storage.from(DOCUMENTS_BUCKET).remove(legacy);
}

/** Signed URL for a path the current user owns (candidate + admin paths). */
export async function signDocumentPath(path: string, expiresIn = 120) {
  if (isR2DocumentKey(path)) {
    const { data, error } = await supabase.functions.invoke("r2-storage", { body: { action: "presign_get", key: path } });
    if (error || !data?.url) throw new Error(data?.error || error?.message || "File unavailable");
    return data.url as string;
  }
  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) throw new Error(error?.message || "File unavailable");
  return data.signedUrl;
}

/** Signed URL resolved server-side (works for employers viewing attached documents). */
export async function signDocumentById(documentId: string, download = false) {
  const { data, error } = await supabase.functions.invoke("document-access", {
    body: { action: "document_url", documentId, download },
  });
  if (error) throw error;
  if (!data?.url) throw new Error(data?.error || "File unavailable");
  return data.url as string;
}
