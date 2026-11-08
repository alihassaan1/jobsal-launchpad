// Sends package/payment emails through the send-email function.
// Never throws: email failure must not break payments.
// deliveryKey makes each email send at most once (checked in email_logs).
// deno-lint-ignore no-explicit-any
type Admin = any;

export const eur = (cents: number) => `€${(cents / 100).toFixed(2)}`;
export const day = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";

export async function sendPackageEmail(
  admin: Admin, userId: string, templateSlug: string, data: Record<string, string>, deliveryKey: string,
  opts: { notifyAdmin?: boolean } = {},
) {
  try {
    const { data: dup } = await admin.from("email_logs").select("id")
      .eq("template_slug", templateSlug).eq("metadata->>delivery_key", deliveryKey).limit(1);
    if (dup?.length) return;
    const { data: profile } = await admin.from("profiles").select("email, full_name").eq("id", userId).maybeSingle();
    if (!profile?.email) return;
    const payload = { name: profile.full_name || "", email: profile.email, ...data, delivery_key: deliveryKey };
    const call = (to: string, slug: string, uid?: string) =>
      fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
        body: JSON.stringify({ to, templateSlug: slug, data: payload, userId: uid }),
      });
    await call(profile.email, templateSlug, userId);
    if (opts.notifyAdmin) await call("info@jobs.al", "admin-payment-notification");
  } catch (e) {
    console.error("package email failed", templateSlug, e);
  }
}
