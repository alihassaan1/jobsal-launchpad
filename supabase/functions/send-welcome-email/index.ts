import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireInternal } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// This function is triggered by a database webhook when a new user signs up
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authorizationCheck = requireInternal(req);
    if (!authorizationCheck.ok) return authorizationCheck.response;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { record } = await req.json();

    if (!record || !record.email) {
      console.log("No user record found in webhook payload");
      return new Response(JSON.stringify({ message: "No user data" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Sending welcome email");

    // Create email preferences for the new user
    const { error: prefsError } = await supabase
      .from("user_email_preferences")
      .upsert({
        user_id: record.id,
        marketing_emails: true,
        job_alerts: true,
        application_updates: true,
        weekly_digest: true,
        resume_reminders: true,
      });

    if (prefsError) {
      console.error("Error creating email preferences:", prefsError);
    }

    // Send welcome email
    const sendEmailResponse = await fetch(
      `${supabaseUrl}/functions/v1/send-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          to: record.email,
          templateSlug: "welcome",
          data: {
            name: record.full_name || "",
          },
          userId: record.id,
        }),
      }
    );

    if (!sendEmailResponse.ok) {
      const errorText = await sendEmailResponse.text();
      throw new Error(`Failed to send welcome email: ${errorText}`);
    }

    console.log("Welcome email sent");

    return new Response(
      JSON.stringify({ success: true, message: "Welcome email sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});