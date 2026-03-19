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

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name, created_at, phone, location, bio, updated_at")
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
        // Check email preferences
        const { data: prefs } = await supabase
          .from("user_email_preferences")
          .select("resume_reminders, unsubscribed_at, job_alerts")
          .eq("user_id", profile.id)
          .maybeSingle();

        if (prefs?.unsubscribed_at) {
          results.skipped++;
          continue;
        }

        // Don't send if we sent any email in the last 24 hours
        const { data: lastEmail } = await supabase
          .from("email_logs")
          .select("template_slug, sent_at")
          .eq("user_id", profile.id)
          .order("sent_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastEmail) {
          const lastSentDate = new Date(lastEmail.sent_at);
          const hoursSinceLastEmail = (now.getTime() - lastSentDate.getTime()) / (60 * 60 * 1000);
          if (hoursSinceLastEmail < 24) {
            results.skipped++;
            continue;
          }
        }

        const signupDate = new Date(profile.created_at);
        const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (24 * 60 * 60 * 1000));

        let templateToSend: string | null = null;
        let extraData: Record<string, string> = {};

        // --- REACTIVATION CHECK (30+ days inactive) ---
        if (daysSinceSignup >= 30) {
          const lastActivity = new Date(profile.updated_at);
          const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000));

          if (daysSinceActivity >= 30) {
            const { count: reactivationSent } = await supabase
              .from("email_logs")
              .select("*", { count: "exact", head: true })
              .eq("user_id", profile.id)
              .eq("template_slug", "reactivation")
              .gte("sent_at", thirtyDaysAgo.toISOString());

            if (!reactivationSent || reactivationSent === 0) {
              const { count: newJobsCount } = await supabase
                .from("jobs")
                .select("*", { count: "exact", head: true })
                .eq("is_active", true)
                .gte("created_at", thirtyDaysAgo.toISOString());

              templateToSend = "reactivation";
              extraData = { newJobsCount: String(newJobsCount || 50) };
            }
          }
        }

        // --- PROFILE INCOMPLETE CHECK (Day 5+) ---
        if (!templateToSend && daysSinceSignup >= 5) {
          const isIncomplete = !profile.phone || !profile.location || !profile.bio;

          if (isIncomplete) {
            const { count: profileEmailSent } = await supabase
              .from("email_logs")
              .select("*", { count: "exact", head: true })
              .eq("user_id", profile.id)
              .eq("template_slug", "profile-incomplete");

            if (!profileEmailSent || profileEmailSent === 0) {
              const missingFields: string[] = [];
              if (!profile.phone) missingFields.push("Numri i telefonit");
              if (!profile.location) missingFields.push("Vendndodhja");
              if (!profile.bio) missingFields.push("Biografia / Përshkrimi");

              const filledCount = 3 - missingFields.length;
              const completionPercent = Math.round(((filledCount + 2) / 5) * 100); // +2 for email & name

              templateToSend = "profile-incomplete";
              extraData = {
                missingFields: missingFields.join(", "),
                completionPercent: String(completionPercent),
              };
            }
          }
        }

        // --- RESUME UPLOAD REMINDER (Day 3) ---
        if (!templateToSend && prefs?.resume_reminders !== false && daysSinceSignup >= 3 && daysSinceSignup < 7) {
          const { count: resumeCount } = await supabase
            .from("resumes")
            .select("*", { count: "exact", head: true })
            .eq("user_id", profile.id);

          if (!resumeCount || resumeCount === 0) {
            const { count: uploadReminderSent } = await supabase
              .from("email_logs")
              .select("*", { count: "exact", head: true })
              .eq("user_id", profile.id)
              .eq("template_slug", "resume-upload-reminder");

            if (!uploadReminderSent || uploadReminderSent === 0) {
              templateToSend = "resume-upload-reminder";
            }
          }
        }

        // --- RESUME REMINDER SEQUENCE ---
        if (!templateToSend && prefs?.resume_reminders !== false) {
          const { count: resumeCount } = await supabase
            .from("resumes")
            .select("*", { count: "exact", head: true })
            .eq("user_id", profile.id);

          if (!resumeCount || resumeCount === 0) {
            if (daysSinceSignup >= 14) {
              const { count: finalCount } = await supabase
                .from("email_logs")
                .select("*", { count: "exact", head: true })
                .eq("user_id", profile.id)
                .eq("template_slug", "resume-reminder-final");
              if (!finalCount || finalCount === 0) {
                const { count: newJobsCount } = await supabase
                  .from("jobs")
                  .select("*", { count: "exact", head: true })
                  .eq("is_active", true)
                  .gte("created_at", sevenDaysAgo.toISOString());
                templateToSend = "resume-reminder-final";
                extraData = { newJobsCount: String(newJobsCount || 50) };
              }
            } else if (daysSinceSignup >= 7) {
              const { count: r2Count } = await supabase
                .from("email_logs")
                .select("*", { count: "exact", head: true })
                .eq("user_id", profile.id)
                .eq("template_slug", "resume-reminder-2");
              if (!r2Count || r2Count === 0) templateToSend = "resume-reminder-2";
            }
          }
        }

        if (!templateToSend) {
          results.skipped++;
          continue;
        }

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
                ...extraData,
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
      JSON.stringify({ success: true, results }),
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
