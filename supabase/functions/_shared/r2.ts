// Shared Cloudflare R2 helper (website images, user documents).
// Image generators fall back to the Supabase `blog-images` bucket when R2 is not configured.
import { AwsClient } from "npm:aws4fetch@1";

const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID");
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY");
const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID");
const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME");
const R2_PUBLIC_URL = (Deno.env.get("R2_PUBLIC_URL") || "").replace(/\/$/, "");

export const r2Configured = !!(
  R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_ACCOUNT_ID && R2_BUCKET_NAME && R2_PUBLIC_URL
);

function client() {
  return new AwsClient({
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
    service: "s3",
    region: "auto",
  });
}

// R2_ACCOUNT_ID may be the bare account ID or the full endpoint URL — normalize it.
export function r2ObjectUrl(key: string) {
  const account = (R2_ACCOUNT_ID || "").replace(/^https?:\/\//, "")
    .replace(/\.r2\.cloudflarestorage\.com\/?$/, "")
    .replace(/\/$/, "");
  return `https://${account}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`;
}

/** Uploads a public website image to R2 and returns its public URL. */
export async function uploadImageToR2(key: string, bytes: Uint8Array, contentType: string): Promise<string> {
  const resp = await client().fetch(r2ObjectUrl(key), {
    method: "PUT", headers: { "Content-Type": contentType }, body: bytes,
  });
  if (!resp.ok) throw new Error(`R2 upload failed: ${resp.status} ${await resp.text()}`);
  return `${R2_PUBLIC_URL}/${key}`;
}

/** Private user documents live under documents/ in R2. */
export const isR2DocumentKey = (key?: string | null) => !!key && key.startsWith("documents/");

export async function r2Download(key: string): Promise<Uint8Array | null> {
  const resp = await client().fetch(r2ObjectUrl(key), { method: "GET" });
  if (!resp.ok) return null;
  return new Uint8Array(await resp.arrayBuffer());
}

export async function r2Delete(keys: string[]) {
  const aws = client();
  await Promise.all(keys.map((k) => aws.fetch(r2ObjectUrl(k), { method: "DELETE" }).catch(() => null)));
}

/** Short-lived presigned GET URL for a private object. */
export async function r2SignedGet(key: string, downloadName?: string, expiresSec = 120) {
  const url = new URL(r2ObjectUrl(key));
  url.searchParams.set("X-Amz-Expires", String(expiresSec));
  if (downloadName) {
    url.searchParams.set("response-content-disposition", `attachment; filename="${downloadName.replace(/"/g, "")}"`);
  }
  const signed = await client().sign(url.toString(), { method: "GET", aws: { signQuery: true } });
  return signed.url;
}
