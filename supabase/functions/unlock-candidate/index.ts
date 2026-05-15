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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { company_id, candidate_user_id } = await req.json();
    if (!company_id || !candidate_user_id) return json({ error: "Missing fields" }, 400);

    const { data: unlockResult, error: rpcErr } = await supabase.rpc("unlock_candidate", {
      _company_id: company_id,
      _candidate_user_id: candidate_user_id,
    });
    if (rpcErr) return json({ error: rpcErr.message }, 400);

    // Now fetch full candidate data (RLS allows it via the unlock row)
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, location, avatar_url, linkedin_url, website_url, bio")
      .eq("id", candidate_user_id)
      .maybeSingle();

    const { data: resume } = await supabase
      .from("resumes")
      .select("id, title, data, extracted_data, resume_file_url, updated_at")
      .eq("user_id", candidate_user_id)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: visibility } = await supabase
      .from("candidate_visibility")
      .select("*")
      .eq("user_id", candidate_user_id)
      .maybeSingle();

    return json({ success: true, unlock: unlockResult, profile, resume, visibility });
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
