// Shared Cloudflare R2 helper for website images (blog posts, job images, etc).
// Falls back to the Supabase `blog-images` bucket when R2 is not configured.
import { AwsClient } from "npm:aws4fetch@1";

const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID");
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY");
const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID");
const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME");
const R2_PUBLIC_URL = (Deno.env.get("R2_PUBLIC_URL") || "").replace(/\/$/, "");

export const r2Configured = !!(
  R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_ACCOUNT_ID && R2_BUCKET_NAME && R2_PUBLIC_URL
);

/** Uploads a public website image to R2 and returns its public URL. */
export async function uploadImageToR2(
  key: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<string> {
  const aws = new AwsClient({
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
    service: "s3",
    region: "auto",
  });
  // R2_ACCOUNT_ID may be the bare account ID or the full endpoint URL — normalize it.
  const account = R2_ACCOUNT_ID!.replace(/^https?:\/\//, "")
    .replace(/\.r2\.cloudflarestorage\.com\/?$/, "")
    .replace(/\/$/, "");
  const resp = await aws.fetch(
    `https://${account}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`,
    { method: "PUT", headers: { "Content-Type": contentType }, body: bytes },
  );
  if (!resp.ok) throw new Error(`R2 upload failed: ${resp.status} ${await resp.text()}`);
  return `${R2_PUBLIC_URL}/${key}`;
}
