import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user ID from JWT
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { job_id } = await req.json();

    if (!job_id) {
      return new Response(JSON.stringify({ error: "job_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Matching candidates for job: ${job_id}`);

    // Verify user owns this job
    const { data: job } = await supabase
      .from("jobs")
      .select(`
        *,
        companies!inner(owner_id)
      `)
      .eq("id", job_id)
      .single();

    if (!job || job.companies.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build job description text
    const jobSkills = job.skills?.join(", ") || "";
    const jobText = `
      Title: ${job.title}
      Description: ${job.description}
      Requirements: ${job.requirements || ""}
      Skills Required: ${jobSkills}
      Experience Level: ${job.experience_level}
      Category: ${job.category}
    `.trim();

    console.log("Job text length:", jobText.length);

    // Get all applications for this job
    const { data: applications } = await supabase
      .from("applications")
      .select(`
        id,
        applicant_id,
        status,
        ai_match_score,
        cover_letter,
        profiles!inner(full_name, email),
        resumes!left(data, extracted_data)
      `)
      .eq("job_id", job_id);

    if (!applications || applications.length === 0) {
      console.log("No applications found for this job");
      return new Response(JSON.stringify({ ranked_candidates: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${applications.length} applications to rank`);

    // Calculate match scores for each candidate
    const rankedCandidates = await Promise.all(
      applications.map(async (application) => {
        const resume = application.resumes?.[0];
        const candidateSkills = resume?.data?.skills?.join(", ") || "";
        const candidateExperience = resume?.data?.experience?.map((exp: any) =>
          `${exp.title} at ${exp.company}: ${exp.description}`
        ).join(". ") || "";
        const candidateEducation = resume?.data?.education?.map((edu: any) =>
          `${edu.degree} in ${edu.field} from ${edu.institution}`
        ).join(". ") || "";

        const candidateText = `
          Skills: ${candidateSkills}
          Experience: ${candidateExperience}
          Education: ${candidateEducation}
          Cover Letter: ${application.cover_letter || ""}
        `.trim();

        let matchScore = application.ai_match_score || 0;
        let matchReasoning: any = {};

        // Use Lovable AI for semantic matching if available and score not already set
        if (lovableApiKey && matchScore === 0) {
          try {
            const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${lovableApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  {
                    role: "system",
                    content: "You are a recruitment expert. Analyze the candidate's qualifications against job requirements to determine match score (0-1). Return ONLY a JSON object with 'score' (number 0-1) and 'strengths' (array of candidate strengths), 'gaps' (array of missing qualifications)."
                  },
                  {
                    role: "user",
                    content: `Job Requirements:\n${jobText}\n\nCandidate Profile:\n${candidateText}\n\nProvide match analysis.`
                  }
                ],
                temperature: 0.3,
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              const content = aiData.choices?.[0]?.message?.content;

              if (content) {
                try {
                  const jsonMatch = content.match(/\{[\s\S]*\}/);
                  if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    matchScore = Math.max(0, Math.min(1, parsed.score || 0));
                    matchReasoning = {
                      strengths: parsed.strengths || [],
                      gaps: parsed.gaps || []
                    };

                    // Update application with AI match score
                    await supabase
                      .from("applications")
                      .update({ ai_match_score: matchScore })
                      .eq("id", application.id);
                  }
                } catch (e) {
                  console.error("Failed to parse AI response:", e);
                }
              }
            }
          } catch (error) {
            console.error("AI matching error for candidate:", error);
          }
        }

        // Fallback: keyword-based matching
        if (matchScore === 0) {
          const candidateSkillsArray = candidateSkills.toLowerCase().split(",").map((s: string) => s.trim());
          const jobSkillsArray = jobSkills.toLowerCase().split(",").map((s: string) => s.trim());

          const matchingSkills = candidateSkillsArray.filter((skill: string) =>
            jobSkillsArray.some((jobSkill: string) => jobSkill.includes(skill) || skill.includes(jobSkill))
          );

          const skillMatch = jobSkillsArray.length > 0
            ? matchingSkills.length / jobSkillsArray.length
            : 0;

          matchScore = Math.min(1, skillMatch);
          matchReasoning = {
            matching_skills: matchingSkills,
            skill_match_percentage: Math.round(skillMatch * 100)
          };
        }

        // Determine fit level
        let fitLevel = "potential";
        if (matchScore >= 0.85) fitLevel = "excellent";
        else if (matchScore >= 0.70) fitLevel = "good";
        else if (matchScore >= 0.50) fitLevel = "potential";
        else fitLevel = "low";

        const profile = Array.isArray(application.profiles) ? application.profiles[0] : application.profiles;
        
        return {
          application_id: application.id,
          applicant_id: application.applicant_id,
          applicant_name: profile?.full_name || "Unknown",
          applicant_email: profile?.email || "",
          status: application.status,
          match_score: matchScore,
          fit_level: fitLevel,
          match_reasoning: matchReasoning,
        };
      })
    );

    // Sort by match score
    const sorted = rankedCandidates.sort((a, b) => b.match_score - a.match_score);

    console.log(`Ranked ${sorted.length} candidates`);

    return new Response(
      JSON.stringify({
        ranked_candidates: sorted,
        total: sorted.length,
        excellent_fits: sorted.filter(c => c.fit_level === "excellent").length,
        good_fits: sorted.filter(c => c.fit_level === "good").length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in match-candidates:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
