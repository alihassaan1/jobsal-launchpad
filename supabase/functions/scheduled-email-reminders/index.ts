import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting scheduled email reminders...");

    // Get all users who:
    // 1. Have no resumes
    // 2. Haven't received a resume reminder in the last 3 days
    // 3. Haven't unsubscribed from resume reminders
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get profiles with their resume count and email preferences
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        created_at
      `)
      .order("created_at", { ascending: true })
      .limit(100);

    if (profilesError) {
      throw new Error(`Error fetching profiles: ${profilesError.message}`);
    }

    console.log(`Found ${profiles?.length || 0} profiles to check`);

    const results = {
      processed: 0,
      emailsSent: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const profile of profiles || []) {
      try {
        // Check if user has any resumes
        const { count: resumeCount } = await supabase
          .from("resumes")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profile.id);

        if (resumeCount && resumeCount > 0) {
          results.skipped++;
          continue; // User has resumes, skip
        }

        // Check email preferences
        const { data: prefs } = await supabase
          .from("user_email_preferences")
          .select("resume_reminders, unsubscribed_at")
          .eq("user_id", profile.id)
          .maybeSingle();

        if (prefs?.unsubscribed_at || prefs?.resume_reminders === false) {
          results.skipped++;
          continue; // User unsubscribed
        }

        // Get last resume reminder sent to this user
        const { data: lastEmail } = await supabase
          .from("email_logs")
          .select("template_slug, sent_at")
          .eq("user_id", profile.id)
          .like("template_slug", "resume-reminder%")
          .order("sent_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Determine which reminder to send based on signup date
        const signupDate = new Date(profile.created_at);
        const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (24 * 60 * 60 * 1000));

        let templateToSend: string | null = null;

        if (daysSinceSignup >= 14 && (!lastEmail || lastEmail.template_slug !== "resume-reminder-final")) {
          // Check if we've sent final reminder
          const { count: finalCount } = await supabase
            .from("email_logs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", profile.id)
            .eq("template_slug", "resume-reminder-final");

          if (!finalCount || finalCount === 0) {
            templateToSend = "resume-reminder-final";
          }
        } else if (daysSinceSignup >= 7 && daysSinceSignup < 14) {
          // Check if we've sent reminder 2
          const { count: reminder2Count } = await supabase
            .from("email_logs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", profile.id)
            .eq("template_slug", "resume-reminder-2");

          if (!reminder2Count || reminder2Count === 0) {
            templateToSend = "resume-reminder-2";
          }
        } else if (daysSinceSignup >= 3 && daysSinceSignup < 7) {
          // Check if we've sent reminder 1
          const { count: reminder1Count } = await supabase
            .from("email_logs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", profile.id)
            .eq("template_slug", "resume-reminder-1");

          if (!reminder1Count || reminder1Count === 0) {
            templateToSend = "resume-reminder-1";
          }
        }

        if (!templateToSend) {
          results.skipped++;
          continue;
        }

        // Don't send if we sent any email in the last 24 hours
        if (lastEmail) {
          const lastSentDate = new Date(lastEmail.sent_at);
          const hoursSinceLastEmail = (now.getTime() - lastSentDate.getTime()) / (60 * 60 * 1000);
          if (hoursSinceLastEmail < 24) {
            results.skipped++;
            continue;
          }
        }

        // Get new jobs count for personalization
        const { count: newJobsCount } = await supabase
          .from("jobs")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true)
          .gte("created_at", sevenDaysAgo.toISOString());

        // Send the email
        const sendEmailResponse = await fetch(
          `${supabaseUrl}/functions/v1/send-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              to: profile.email,
              templateSlug: templateToSend,
              data: {
                name: profile.full_name || "",
                newJobsCount: String(newJobsCount || 50),
              },
              userId: profile.id,
            }),
          }
        );

        if (sendEmailResponse.ok) {
          results.emailsSent++;
          console.log(`Sent ${templateToSend} to ${profile.email}`);
        } else {
          const errorText = await sendEmailResponse.text();
          results.errors.push(`Failed to send to ${profile.email}: ${errorText}`);
        }

        results.processed++;
      } catch (userError: any) {
        results.errors.push(`Error processing ${profile.email}: ${userError.message}`);
      }
    }

    console.log("Scheduled email reminders completed:", results);

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in scheduled-email-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});