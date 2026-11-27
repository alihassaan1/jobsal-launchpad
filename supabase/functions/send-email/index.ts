import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { packageTemplates } from "./packageTemplates.ts";
import { lifecycleTemplates } from "./templates.ts";
import { wrapEmail } from "../_shared/emailLayout.ts";
import { requireAdmin, requireInternal } from "../_shared/auth.ts";
import { sanitizeEmailData } from "../_shared/emailSecurity.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// All templates share the branded layout in ../_shared/emailLayout.ts.
function getEmailTemplate(templateSlug: string, data: Record<string, string>): { subject: string; html: string } {
  const templates: Record<string, { subject: string; html: string }> = {
    ...lifecycleTemplates(data),
    ...packageTemplates(data, (c, preheader) => wrapEmail(c, { preheader })),
  };
  return templates[templateSlug] || templates["welcome"];
}

const EMAIL_RE = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;

// ==================== MAIN HANDLER ====================

interface SendEmailRequest {
  to: string;
  templateSlug: string;
  data?: Record<string, string>;
  userId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const internalCheck = await requireInternal(req);
    const authorizationCheck = internalCheck.ok ? internalCheck : await requireAdmin(req);
    if (!authorizationCheck.ok) return authorizationCheck.response;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { to, templateSlug, data = {}, userId }: SendEmailRequest = await req.json();

    if (!to || !templateSlug) {
      throw new Error("Missing required fields: to, templateSlug");
    }

    // Get email template
    const template = getEmailTemplate(templateSlug, sanitizeEmailData(data));

    // Send email via Resend
    // Employer replies to a new-applicant alert go straight to the candidate.
    const applicantEmail = String(data.applicantEmail ?? "").trim();
    const replyTo = templateSlug === "new-applicant" && EMAIL_RE.test(applicantEmail) ? applicantEmail : undefined;

    const emailResponse = await resend.emails.send({
      from: "Jobs.al <info@jobs.al>",
      to: [to],
      subject: template.subject,
      html: template.html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    });

    const didFail = !!emailResponse.error;
    if (didFail) {
      console.error("Resend send failed:", emailResponse.error);
    } else {
      console.log("Email sent successfully:", emailResponse.data?.id);
    }

    // Log the email (accurate status)
    const { error: logError } = await supabase.from("email_logs").insert({
      user_id: userId || null,
      template_slug: templateSlug,
      email_to: to,
      subject: template.subject,
      status: didFail ? "failed" : "sent",
      sent_at: new Date().toISOString(),
      error_message: emailResponse.error?.message || null,
      metadata: data,
    });

    if (logError) {
      console.error("Error logging email:", logError);
    }

    return new Response(
      JSON.stringify({
        success: !didFail,
        data: emailResponse.data,
        error: emailResponse.error?.message || null,
      }),
      {
        status: didFail ? 502 : 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
