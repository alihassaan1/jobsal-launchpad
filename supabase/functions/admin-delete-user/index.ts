// Admin: permanently delete a user account. Invoices/payments are kept and detached.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const URL_ = Deno.env.get("SUPABASE_URL")!;
    const auth = req.headers.get("Authorization") ?? "";
    const uc = createClient(URL_, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: u } = await uc.auth.getUser();
    if (!u?.user) return json({ error: "Unauthorized" }, 401);
    const admin = createClient(URL_, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: isAdmin } = await admin.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
    if (!isAdmin) return json({ error: "Forbidden: admins only" }, 403);

    const { user_id } = await req.json().catch(() => ({}));
    if (typeof user_id !== "string" || !/^[0-9a-f-]{36}$/i.test(user_id)) return json({ error: "user_id required" }, 400);
    if (user_id === u.user.id) return json({ error: "You can't delete your own account." }, 400);

    const { count: owned } = await admin.from("companies").select("id", { count: "exact", head: true }).eq("owner_id", user_id);
    if ((owned ?? 0) > 0) return json({ error: "This user owns a company. Delete the company first (Admin → Companies), or transfer ownership." }, 400);

    // Detach audit/financial references (records are kept).
    const detach: [string, string][] = [
      ["invoices", "user_id"], ["invoices", "created_by"], ["payment_transactions", "user_id"],
      ["billing_settings", "updated_by"], ["promo_codes", "created_by"],
      ["client_package_offers", "assigned_by"], ["client_package_offers", "employer_user_id"],
    ];
    for (const [t, c] of detach) await admin.from(t).update({ [c]: null }).eq(c, user_id);
    for (const t of ["company_members", "user_roles", "user_email_preferences", "email_queue"]) {
      await admin.from(t).delete().eq("user_id", user_id);
    }
    await admin.from("profiles").delete().eq("id", user_id);
    const { error } = await admin.auth.admin.deleteUser(user_id);
    if (error) return json({ error: "Could not delete account: " + error.message }, 400);
    return json({ success: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
