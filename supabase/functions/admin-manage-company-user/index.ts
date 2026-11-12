// Admin-only: add/create a user under a company, change their team role, or remove them.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const ROLES = ["owner", "recruiter", "viewer"];
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isUuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.toLowerCase().startsWith("bearer ")) return json({ error: "Unauthorized" }, 401);
    const { data: u } = await createClient(url, anon, { global: { headers: { Authorization: auth } } }).auth.getUser();
    if (!u?.user) return json({ error: "Unauthorized" }, 401);
    const admin = createClient(url, service, { auth: { persistSession: false } });
    const { data: isAdmin } = await admin.from("user_roles").select("id").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
    if (!isAdmin) return json({ error: "Forbidden: admins only" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");
    const companyId = String(body.company_id || "");
    if (!isUuid(companyId)) return json({ error: "company_id required" }, 400);
    const { data: company } = await admin.from("companies").select("id, owner_id").eq("id", companyId).maybeSingle();
    if (!company) return json({ error: "Company not found" }, 404);

    if (action === "add") {
      const email = String(body.email || "").trim().toLowerCase();
      const fullName = String(body.full_name || "").trim();
      const password = String(body.password || "Login@123");
      const role = String(body.role || "recruiter");
      if (!isEmail(email)) return json({ error: "Enter a valid email" }, 400);
      if (!ROLES.includes(role)) return json({ error: "Invalid role" }, 400);
      if (password.length < 6) return json({ error: "Password must be at least 6 characters" }, 400);

      let userId: string | null = null;
      let created = false;
      const { data: prof } = await admin.from("profiles").select("id").ilike("email", email).maybeSingle();
      if (prof) userId = prof.id;
      else {
        const { data, error } = await admin.auth.admin.createUser({
          email, password, email_confirm: true,
          user_metadata: { full_name: fullName || email.split("@")[0], account_type: "employer" },
        });
        if (error) return json({ error: error.message }, 400);
        userId = data.user!.id;
        created = true;
      }
      // Ensure employer role. Remove the auto-created draft company for brand-new users so they only belong to this company.
      await admin.from("user_roles").upsert({ user_id: userId, role: "employer" }, { onConflict: "user_id,role", ignoreDuplicates: true });
      if (created) {
        await admin.from("companies").delete().eq("owner_id", userId).like("name", "% (Draft)");
      }
      const { error: mErr } = await admin.from("company_members").upsert(
        { company_id: companyId, user_id: userId, role, invited_by: u.user.id, accepted_at: new Date().toISOString() },
        { onConflict: "company_id,user_id" },
      );
      if (mErr) return json({ error: mErr.message }, 400);
      return json({ success: true, user_id: userId, created, password: created ? password : null });
    }

    if (action === "delete_company") {
      const [{ count: offers }, { count: invoices }, { data: jobRows }] = await Promise.all([
        admin.from("client_package_offers").select("id", { count: "exact", head: true }).eq("company_id", companyId),
        admin.from("invoices").select("id", { count: "exact", head: true }).eq("company_id", companyId),
        admin.from("jobs").select("id").eq("company_id", companyId),
      ]);
      void offers; void invoices;
      const { count: paidOffers } = await admin.from("client_package_offers").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "paid");
      if ((paidOffers ?? 0) > 0) return json({ error: "This company has a paid package, so it can't be deleted. Unverify or hide it instead." }, 400);
      // Invoices are never deleted: void and detach them (number is kept).
      const { data: invs } = await admin.from("invoices").select("id, status, notes").eq("company_id", companyId);
      for (const inv of invs ?? []) {
        await admin.from("invoices").update({ status: inv.status === "paid" ? inv.status : "void", company_id: null, notes: `${inv.notes ?? ""}\nVOID: company deleted by admin.`.trim() }).eq("id", inv.id);
      }
      const { data: offerRows } = await admin.from("client_package_offers").select("id").eq("company_id", companyId);
      const offerIds = (offerRows ?? []).map((o: any) => o.id);
      if (offerIds.length) {
        await admin.from("invoices").update({ client_package_offer_id: null } as any).in("client_package_offer_id", offerIds);
        await admin.from("paypal_orders").delete().in("client_package_offer_id", offerIds);
        const { error: oErr } = await admin.from("client_package_offers").delete().in("id", offerIds);
        if (oErr) return json({ error: "Could not remove package offer: " + oErr.message }, 400);
      }
      const jobIds = (jobRows ?? []).map((j: any) => j.id);
      if (jobIds.length) {
        const { count: apps } = await admin.from("applications").select("id", { count: "exact", head: true }).in("job_id", jobIds);
        if ((apps ?? 0) > 0) return json({ error: "This company's jobs have applications, so it can't be deleted. Unverify or hide it instead." }, 400);
        const { count: paid } = await admin.from("job_listings").select("id", { count: "exact", head: true }).in("job_id", jobIds);
        if ((paid ?? 0) > 0) return json({ error: "This company has paid or credited jobs, so it can't be deleted. Unverify or hide it instead." }, 400);
        for (const t of ["saved_jobs", "job_recommendations", "analytics", "ad_analytics"]) await admin.from(t).delete().in("job_id", jobIds);
        await admin.from("jobs").delete().in("id", jobIds);
      }
      for (const t of ["company_members", "company_member_invites", "company_followers", "analytics", "ad_analytics", "company_billing_profiles"]) await admin.from(t).delete().eq("company_id", companyId);
      const { error } = await admin.from("companies").delete().eq("id", companyId);
      if (error) return json({ error: "Could not delete company: " + error.message }, 400);
      if (body.make_candidate && company.owner_id) {
        const { count: others } = await admin.from("companies").select("id", { count: "exact", head: true }).eq("owner_id", company.owner_id);
        if (!others) {
          await admin.from("user_roles").delete().eq("user_id", company.owner_id).eq("role", "employer");
          await admin.from("user_roles").upsert({ user_id: company.owner_id, role: "job_seeker" }, { onConflict: "user_id,role" });
        }
      }
      return json({ success: true });
    }

    const userId = String(body.user_id || "");
    if (!isUuid(userId)) return json({ error: "user_id required" }, 400);

    if (action === "set_role") {
      const role = String(body.role || "");
      if (!ROLES.includes(role)) return json({ error: "Invalid role" }, 400);
      const { error } = await admin.from("company_members").upsert(
        { company_id: companyId, user_id: userId, role, invited_by: u.user.id, accepted_at: new Date().toISOString() },
        { onConflict: "company_id,user_id" },
      );
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    if (action === "remove") {
      if (userId === company.owner_id) return json({ error: "The company owner can't be removed." }, 400);
      const { error } = await admin.from("company_members").delete().eq("company_id", companyId).eq("user_id", userId);
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }


    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
