import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SignupBody = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(128),
  fullName: z.string().trim().min(1).max(120).optional(),
  full_name: z.string().trim().min(1).max(120).optional(),
  accountType: z.enum(["job_seeker", "employer"]).default("employer"),
}).refine((body) => body.fullName || body.full_name, { message: "Full name is required" });

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]!));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let createdUserId: string | null = null;
  try {
    const parsed = SignupBody.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return json({ error: "Enter a valid name, email and password." }, 400);
    const email = parsed.data.email.toLowerCase();
    const password = parsed.data.password;
    const fullName = (parsed.data.fullName || parsed.data.full_name || "").trim();
    const accountType = parsed.data.accountType;

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!supabaseUrl || !serviceRoleKey || !resendKey) return json({ error: "Signup service is not configured." }, 500);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name: fullName, account_type: accountType },
    });
    createdUserId = data.user?.id ?? null;

    if (error) {
      const message = (error.message || "").toLowerCase();
      if (message.includes("already") || message.includes("registered") || message.includes("exists")) {
        return json({ error: "This email is already registered. Sign in to continue." }, 409);
      }
      return json({ error: "Could not create the account. Please try again." }, 400);
    }
    if (!createdUserId) return json({ error: "Could not create the account." }, 500);

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: { redirectTo: "https://jobs.al/auth/confirm" },
    });
    const tokenHash = linkData?.properties?.hashed_token;
    if (linkError || !tokenHash) {
      await admin.auth.admin.deleteUser(createdUserId);
      return json({ error: "Could not prepare the confirmation email. Please try again." }, 502);
    }

    const confirmationUrl = `https://jobs.al/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=signup`;
    const safeName = escapeHtml(fullName);
    const accountLabel = accountType === "employer" ? "employer / punëdhënës" : "job seeker / kërkues pune";
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Jobs.al <info@jobs.al>",
        to: [email],
        subject: "Confirm your Jobs.al account / Konfirmo llogarinë",
        html: `<!doctype html><html><body style="margin:0;background:#f7f7f8;font-family:Arial,sans-serif;color:#18181b"><div style="max-width:600px;margin:0 auto;padding:32px 16px"><div style="background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:32px"><div style="color:#E8272C;font-size:24px;font-weight:700;margin-bottom:24px">Jobs.al</div><p>Përshëndetje ${safeName},</p><p>Your ${accountLabel} account has been created. Confirm your email to activate it.</p><p>Llogaria juaj u krijua. Konfirmoni emailin për ta aktivizuar.</p><p style="margin:32px 0"><a href="${confirmationUrl}" style="display:inline-block;background:#E8272C;color:#fff;text-decoration:none;padding:14px 24px;border-radius:8px;font-weight:700">Confirm account / Konfirmo llogarinë</a></p><p style="font-size:13px;color:#52525b">If the button does not work, open this direct link:</p><p style="font-size:13px;word-break:break-all"><a href="${confirmationUrl}" style="color:#E8272C">${confirmationUrl}</a></p></div></div></body></html>`,
      }),
    });
    if (!emailResponse.ok) {
      console.error(`Confirmation email failed with Resend status ${emailResponse.status}`);
      await admin.auth.admin.deleteUser(createdUserId);
      return json({ error: "Could not deliver the confirmation email. Please try again shortly." }, 502);
    }

    return json({ success: true, confirmation_required: true });
  } catch (error) {
    console.error("Signup failed", error instanceof Error ? error.message : "unknown error");
    return json({ error: "Signup failed. Please try again." }, 500);
  }
});
