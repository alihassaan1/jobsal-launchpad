import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireInternal } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authorizationCheck = await requireInternal(req, "scheduled-job-alerts");
    if (!authorizationCheck.ok) return authorizationCheck.response;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting scheduled job alerts...");

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const results = {
      jobMatchAlertsSent: 0,
      jobExpiringAlertsSent: 0,
      errors: [] as string[],
    };

    // ==================== JOB MATCH ALERTS ====================
    // Get new jobs posted in last 24h
    const { data: newJobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, title, slug, location, job_type, category, skills, experience_level, company_id, companies(name)")
      .eq("is_active", true)
      .gte("created_at", oneDayAgo.toISOString())
      .limit(50);

    if (jobsError) {
      console.error("Error fetching new jobs:", jobsError);
    }

    if (newJobs && newJobs.length > 0) {
      console.log(`Found ${newJobs.length} new jobs in last 24h`);

      // Get users with resumes who have job_alerts enabled
      const { data: usersWithResumes, error: usersError } = await supabase
        .from("resumes")
        .select("user_id, data, extracted_data")
        .eq("is_active", true)
        .limit(200);

      if (usersError) {
        console.error("Error fetching resumes:", usersError);
      }

      // Deduplicate by user_id
      const userResumes = new Map<string, any>();
      for (const resume of usersWithResumes || []) {
        if (!userResumes.has(resume.user_id)) {
          userResumes.set(resume.user_id, resume);
        }
      }

      for (const [userId, resume] of userResumes) {
        try {
          // Check preferences
          const { data: prefs } = await supabase
            .from("user_email_preferences")
            .select("job_alerts, unsubscribed_at")
            .eq("user_id", userId)
            .maybeSingle();

          if (prefs?.unsubscribed_at || prefs?.job_alerts === false) continue;

          // Check if we already sent a job-match email today
          const { count: sentToday } = await supabase
            .from("email_logs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("template_slug", "job-match")
            .gte("sent_at", oneDayAgo.toISOString());

          if (sentToday && sentToday > 0) continue;

          // Simple skill-based matching
          const resumeData = resume.extracted_data || resume.data || {};
          const userSkills: string[] = (resumeData.skills || []).map((s: string) => s.toLowerCase());
          const userTitle = (resumeData.title || resumeData.personalInfo?.title || "").toLowerCase();

          if (userSkills.length === 0 && !userTitle) continue;

          const matchedJobs = newJobs
            .map(job => {
              let score = 0;
              const jobSkills = (job.skills || []).map((s: string) => s.toLowerCase());
              const jobTitle = job.title.toLowerCase();

              // Skill overlap
              const commonSkills = userSkills.filter(s => jobSkills.some((js: string) => js.includes(s) || s.includes(js)));
              score += commonSkills.length * 20;

              // Title similarity
              if (userTitle && jobTitle.includes(userTitle.split(' ')[0])) score += 30;

              // Category match from resume
              const userCategories = (resumeData.categories || []).map((c: string) => c.toLowerCase());
              if (userCategories.includes(job.category.toLowerCase())) score += 25;

              return { ...job, matchScore: Math.min(score, 100) };
            })
            .filter(job => job.matchScore >= 20)
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 5);

          if (matchedJobs.length === 0) continue;

          // Get user profile for email
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", userId)
            .single();

          if (!profile?.email) continue;

          const jobsPayload = matchedJobs.map(j => ({
            title: j.title,
            company: (j.companies as any)?.name || "Kompani",
            location: j.location,
            type: j.job_type.replace("_", " "),
            slug: j.slug,
            matchScore: j.matchScore,
          }));

          const sendResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              to: profile.email,
              templateSlug: "job-match",
              data: {
                name: profile.full_name || "",
                matchCount: String(matchedJobs.length),
                jobs: JSON.stringify(jobsPayload),
              },
              userId,
            }),
          });

          if (sendResponse.ok) {
            results.jobMatchAlertsSent++;
            console.log(`Sent job-match (${matchedJobs.length} matches)`);
          } else {
            results.errors.push(`Failed job-match`);
          }
        } catch (err: any) {
          results.errors.push(`Error processing user ${userId}: ${err.message}`);
        }
      }
    }

    // ==================== JOB EXPIRING ALERTS ====================
    // Find jobs expiring within 3 days
    const { data: expiringJobs, error: expiringError } = await supabase
      .from("jobs")
      .select("id, title, slug, location, job_type, application_deadline, companies(name)")
      .eq("is_active", true)
      .not("application_deadline", "is", null)
      .lte("application_deadline", threeDaysFromNow.toISOString())
      .gte("application_deadline", now.toISOString())
      .limit(20);

    if (expiringError) {
      console.error("Error fetching expiring jobs:", expiringError);
    }

    if (expiringJobs && expiringJobs.length > 0) {
      console.log(`Found ${expiringJobs.length} jobs expiring soon`);

      for (const job of expiringJobs) {
        try {
          // Find users who viewed or have analytics events for this job
          const { data: viewers } = await supabase
            .from("analytics")
            .select("user_id")
            .eq("job_id", job.id)
            .eq("event_type", "job_view")
            .not("user_id", "is", null)
            .limit(50);

          const uniqueViewers = [...new Set((viewers || []).map(v => v.user_id))];

          for (const viewerId of uniqueViewers) {
            // Check if already applied
            const { count: appliedCount } = await supabase
              .from("applications")
              .select("*", { count: "exact", head: true })
              .eq("job_id", job.id)
              .eq("applicant_id", viewerId);

            if (appliedCount && appliedCount > 0) continue;

            // Check prefs
            const { data: prefs } = await supabase
              .from("user_email_preferences")
              .select("job_expiring_alerts, unsubscribed_at")
              .eq("user_id", viewerId)
              .maybeSingle();

            if (prefs?.unsubscribed_at || prefs?.job_expiring_alerts === false) continue;

            // Check if already sent for this job
            const { count: alreadySent } = await supabase
              .from("email_logs")
              .select("*", { count: "exact", head: true })
              .eq("user_id", viewerId)
              .eq("template_slug", "job-expiring")
              .eq("metadata->>jobId", job.id);

            if (alreadySent && alreadySent > 0) continue;

            const { data: profile } = await supabase
              .from("profiles")
              .select("email, full_name")
              .eq("id", viewerId)
              .single();

            if (!profile?.email) continue;

            const deadline = new Date(job.application_deadline!);
            const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

            const sendResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                to: profile.email,
                templateSlug: "job-expiring",
                data: {
                  name: profile.full_name || "",
                  jobTitle: job.title,
                  company: (job.companies as any)?.name || "",
                  location: job.location,
                  jobType: job.job_type.replace("_", " "),
                  jobSlug: job.slug,
                  daysLeft: String(daysLeft),
                  deadline: deadline.toLocaleDateString("sq-AL"),
                  jobId: job.id,
                },
                userId: viewerId,
              }),
            });

            if (sendResponse.ok) {
              results.jobExpiringAlertsSent++;
            }
          }
        } catch (err: any) {
          results.errors.push(`Error processing expiring job ${job.id}: ${err.message}`);
        }
      }
    }

    console.log("Scheduled job alerts completed:", results);

    return new Response(
      JSON.stringify({ success: true, results: { ...results, errors: results.errors.length } }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in scheduled-job-alerts:", error);
    return new Response(
      JSON.stringify({ error: "Scheduled task failed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
