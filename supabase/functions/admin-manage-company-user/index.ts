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
