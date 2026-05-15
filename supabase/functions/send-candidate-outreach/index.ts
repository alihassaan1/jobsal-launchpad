import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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

    const { company_id, candidate_user_id, subject, message, job_id, reply_to } = await req.json();
    if (!company_id || !candidate_user_id || !subject || !message) {
      return json({ error: "Missing fields" }, 400);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    // Fetch candidate email (admin client to bypass RLS for the email itself)
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: candidate } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", candidate_user_id)
      .maybeSingle();

    if (!candidate?.email) return json({ error: "Candidate has no email" }, 404);

    // Verify candidate has allow_contact = true and is searchable
    const { data: vis } = await admin
      .from("candidate_visibility")
      .select("allow_contact, is_searchable")
      .eq("user_id", candidate_user_id)
      .maybeSingle();
    if (!vis?.is_searchable || !vis?.allow_contact) {
      return json({ error: "Candidate is not accepting messages" }, 403);
    }

    const { data: company } = await admin
      .from("companies")
      .select("name, logo_url")
      .eq("id", company_id)
      .maybeSingle();

    // Insert outreach row (RLS check via user-scoped client)
    const { data: outreach, error: insErr } = await supabase
      .from("candidate_outreach")
      .insert({
        company_id,
        sender_user_id: user.id,
        candidate_user_id,
        job_id: job_id ?? null,
        subject,
        message,
        email_status: "pending",
      })
      .select()
      .single();
    if (insErr) return json({ error: insErr.message }, 400);

    // Send email via Resend
    const html = renderEmail({
      candidateName: candidate.full_name ?? "",
      companyName: company?.name ?? "A company on Jobs.al",
      subject,
      message,
      jobLink: job_id ? `https://jobs.al/jobs?id=${job_id}` : null,
    });

    let emailStatus = "sent";
    let emailError: string | null = null;
    if (RESEND_API_KEY) {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Jobs.al <info@jobs.al>",
          to: candidate.email,
          subject: `${subject} — via ${company?.name ?? "Jobs.al"}`,
          html,
          reply_to: reply_to ?? undefined,
        }),
      });
      if (!r.ok) {
        emailError = await r.text();
        emailStatus = "failed";
      }
    } else {
      emailStatus = "skipped";
    }

    await admin
      .from("candidate_outreach")
      .update({ email_status: emailStatus, delivered_at: emailStatus === "sent" ? new Date().toISOString() : null })
      .eq("id", outreach.id);

    return json({ success: true, outreach_id: outreach.id, email_status: emailStatus, email_error: emailError });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function renderEmail(p: { candidateName: string; companyName: string; subject: string; message: string; jobLink: string | null }) {
  const safe = (s: string) => s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#f5f5f5;margin:0;padding:24px">
<table align="center" width="600" style="background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e5e5">
<tr><td style="background:#E8272C;padding:20px;color:#fff;font-weight:700;font-size:18px">jobs.al</td></tr>
<tr><td style="padding:24px">
<p style="color:#333">Hi ${safe(p.candidateName) || "there"},</p>
<p style="color:#333"><strong>${safe(p.companyName)}</strong> reached out to you on Jobs.al:</p>
<div style="background:#fafafa;border-left:3px solid #E8272C;padding:14px;margin:16px 0;color:#333;white-space:pre-wrap">${safe(p.message)}</div>
${p.jobLink ? `<p><a href="${p.jobLink}" style="background:#E8272C;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">View the job</a></p>` : ""}
<p style="color:#666;font-size:12px;margin-top:24px">You're receiving this because you opted in to be discovered by employers on Jobs.al. <a href="https://jobs.al/candidate/visibility">Manage your visibility settings</a>.</p>
</td></tr></table></body></html>`;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
