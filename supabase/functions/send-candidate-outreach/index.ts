import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { button, h1, link, note, p, wrapEmail } from "../_shared/emailLayout.ts";

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
          subject: `${subject} (via ${company?.name ?? "Jobs.al"})`,
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

function renderEmail(d: { candidateName: string; companyName: string; subject: string; message: string; jobLink: string | null }) {
  const safe = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return wrapEmail(
    h1(`Mesazh nga ${safe(d.companyName)}`, safe(d.subject))
    + p(`Hi ${safe(d.candidateName) || "there"},`)
    + p(`<b>${safe(d.companyName)}</b> reached out to you on Jobs.al:`)
    + note(`<div style="white-space:pre-wrap;">${safe(d.message)}</div>`)
    + (d.jobLink ? button("View the job", d.jobLink) : "")
    + p(`You're receiving this because you opted in to be discovered by employers on Jobs.al. ${link("Manage your visibility settings", "https://jobs.al/candidate/visibility")}.`, true),
    { preheader: `${safe(d.companyName)} sent you a message on Jobs.al.`, unsubscribeUrl: "https://jobs.al/candidate/visibility", signOff: false },
  );
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
