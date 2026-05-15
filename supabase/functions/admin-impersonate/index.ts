import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Admins only" }, 403);

    const { target_user_id } = await req.json();
    if (!target_user_id) return json({ error: "Missing target_user_id" }, 400);
    if (target_user_id === caller.id) return json({ error: "Cannot impersonate yourself" }, 400);

    // Get target email
    const { data: targetProfile } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", target_user_id)
      .maybeSingle();

    if (!targetProfile?.email) return json({ error: "Target user has no email" }, 404);

    // Block impersonating other admins (defense in depth)
    const { data: targetIsAdmin } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", target_user_id)
      .eq("role", "admin")
      .maybeSingle();
    if (targetIsAdmin) return json({ error: "Cannot impersonate another admin" }, 403);

    // Generate magic link to mint a session for the target user
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: targetProfile.email,
    });
    if (linkError || !linkData?.properties?.hashed_token) {
      return json({ error: linkError?.message ?? "Failed to generate session" }, 500);
    }

    // Audit log
    await admin.from("admin_impersonation_logs").insert({
      admin_user_id: caller.id,
      target_user_id,
      target_email: targetProfile.email,
      ip_address: req.headers.get("x-forwarded-for") ?? null,
      user_agent: req.headers.get("user-agent") ?? null,
    });

    return json({
      success: true,
      target: {
        id: target_user_id,
        email: targetProfile.email,
        full_name: targetProfile.full_name,
      },
      hashed_token: linkData.properties.hashed_token,
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
