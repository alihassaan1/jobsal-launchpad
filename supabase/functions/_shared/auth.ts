import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

export type AuthResult =
  | { ok: true; userId?: string }
  | { ok: false; response: Response };

const denied = (status: 401 | 403, error: string): AuthResult => ({
  ok: false,
  response: new Response(JSON.stringify({ error }), {
    status,
    headers: {
      ...corsHeaders,
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
      "Content-Type": "application/json",
    },
  }),
});

export async function requireAdmin(req: Request): Promise<AuthResult> {
  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return denied(401, "Authentication required");

  const token = authorization.slice(7).trim();
  if (!token) return denied(401, "Authentication required");

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) throw new Error("Authentication service is not configured");

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return denied(401, "Invalid or expired session");

  const { data: role, error: roleError } = await admin
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();
  if (roleError) throw roleError;
  if (!role) return denied(403, "Admin access required");

  return { ok: true, userId: user.id };
}

export function requireInternal(req: Request): AuthResult {
  const internalSecret = Deno.env.get("INTERNAL_CRON_SECRET");
  const suppliedSecret = req.headers.get("x-internal-secret") ?? "";
  if (internalSecret && suppliedSecret && suppliedSecret === internalSecret) {
    return { ok: true };
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = req.headers.get("Authorization") ?? "";
  if (serviceRoleKey && authorization === `Bearer ${serviceRoleKey}`) {
    return { ok: true };
  }

  return denied(401, "Internal authentication required");
}
