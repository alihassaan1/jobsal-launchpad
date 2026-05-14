import { supabase } from "@/integrations/supabase/client";

const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "company";

/**
 * Ensure an employer has at least a draft `companies` row.
 * Returns the company id (existing or newly created), or null on failure.
 */
export async function ensureCompanyForUser(opts: {
  userId: string;
  fullName?: string | null;
  email?: string | null;
}): Promise<string | null> {
  const { userId, fullName, email } = opts;
  if (!userId) return null;

  // Already has one?
  const { data: existing, error: selErr } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  if (selErr) {
    console.warn("ensureCompanyForUser select error:", selErr);
  }
  if (existing?.id) return existing.id;

  const baseName =
    (fullName && fullName.trim()) ||
    (email ? email.split("@")[0] : null) ||
    "New Employer";
  const displayName = `${baseName} (Draft)`;
  const slug = `${slugify(baseName)}-${(crypto.randomUUID?.() || Math.random().toString(36)).slice(0, 6)}`;

  const { data: inserted, error: insErr } = await supabase
    .from("companies")
    .insert({
      name: displayName,
      slug,
      owner_id: userId,
      email: email || null,
      is_verified: false,
    })
    .select("id")
    .maybeSingle();

  if (insErr) {
    console.error("ensureCompanyForUser insert error:", insErr);
    return null;
  }
  return inserted?.id ?? null;
}
