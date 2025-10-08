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

    console.log(`Matching jobs for user: ${user.id}`);

    // Get user's profile and resume data
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: resumes } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1);

    const resume = resumes?.[0];

    // Build user profile text for matching
    const userSkills = resume?.data?.skills?.join(", ") || "";
    const userExperience = resume?.data?.experience?.map((exp: any) => 
      `${exp.title} at ${exp.company}: ${exp.description}`
    ).join(". ") || "";
    const userEducation = resume?.data?.education?.map((edu: any) =>
      `${edu.degree} in ${edu.field} from ${edu.institution}`
    ).join(". ") || "";

    const userProfileText = `
      Skills: ${userSkills}
      Experience: ${userExperience}
      Education: ${userEducation}
      Bio: ${profile?.bio || ""}
    `.trim();

    console.log("User profile text length:", userProfileText.length);

    // Get active jobs
    const { data: jobs } = await supabase
      .from("jobs")
      .select(`
        id,
        title,
        description,
        requirements,
        skills,
        category,
        experience_level,
        companies!inner(name)
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!jobs || jobs.length === 0) {
      console.log("No active jobs found");
      return new Response(JSON.stringify({ recommendations: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${jobs.length} active jobs to match`);

    // Calculate match scores for each job
    const recommendations = await Promise.all(
      jobs.map(async (job) => {
        const jobSkills = job.skills?.join(", ") || "";
        const jobText = `
          Title: ${job.title}
          Description: ${job.description}
          Requirements: ${job.requirements || ""}
          Skills: ${jobSkills}
          Category: ${job.category}
          Experience Level: ${job.experience_level}
        `.trim();

        let matchScore = 0;
        let matchedOn: any = {};

        // Use Lovable AI for semantic matching if available
        if (lovableApiKey) {
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
                    content: "You are a job matching expert. Analyze the candidate profile and job description to determine match score (0-1). Return ONLY a JSON object with 'score' (number 0-1) and 'reasons' (array of strings explaining key matches)."
                  },
                  {
                    role: "user",
                    content: `Candidate Profile:\n${userProfileText}\n\nJob Description:\n${jobText}\n\nProvide match score and reasons.`
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
                  // Try to parse JSON from the response
                  const jsonMatch = content.match(/\{[\s\S]*\}/);
                  if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    matchScore = Math.max(0, Math.min(1, parsed.score || 0));
                    matchedOn = { reasons: parsed.reasons || [] };
                  }
                } catch (e) {
                  console.error("Failed to parse AI response:", e);
                }
              }
            }
          } catch (error) {
            console.error("AI matching error:", error);
          }
        }

        // Fallback: Simple keyword-based matching
        if (matchScore === 0) {
          const userSkillsArray = userSkills.toLowerCase().split(",").map((s: string) => s.trim());
          const jobSkillsArray = jobSkills.toLowerCase().split(",").map((s: string) => s.trim());
          
          const matchingSkills = userSkillsArray.filter((skill: string) => 
            jobSkillsArray.some((jobSkill: string) => jobSkill.includes(skill) || skill.includes(jobSkill))
          );

          const skillMatch = jobSkillsArray.length > 0 
            ? matchingSkills.length / jobSkillsArray.length 
            : 0;

          const titleMatch = userProfileText.toLowerCase().includes(job.title.toLowerCase()) ? 0.2 : 0;
          const categoryMatch = userProfileText.toLowerCase().includes(job.category.toLowerCase()) ? 0.1 : 0;

          matchScore = Math.min(1, (skillMatch * 0.7) + titleMatch + categoryMatch);
          matchedOn = { 
            matching_skills: matchingSkills,
            skill_match_percentage: Math.round(skillMatch * 100)
          };
        }

        const company = Array.isArray(job.companies) ? job.companies[0] : job.companies;
        
        return {
          job_id: job.id,
          job_title: job.title,
          company_name: company?.name || "Unknown",
          match_score: matchScore,
          matched_on: matchedOn,
        };
      })
    );

    // Sort by match score and filter out low scores
    const sortedRecommendations = recommendations
      .filter(r => r.match_score >= 0.3)
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 20);

    console.log(`Calculated ${sortedRecommendations.length} recommendations`);

    // Store recommendations in database
    for (const rec of sortedRecommendations) {
      await supabase
        .from("job_recommendations")
        .upsert({
          user_id: user.id,
          job_id: rec.job_id,
          ai_match_score: rec.match_score,
          matched_on: rec.matched_on,
        }, {
          onConflict: "user_id,job_id"
        });
    }

    return new Response(
      JSON.stringify({ 
        recommendations: sortedRecommendations,
        total: sortedRecommendations.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in match-jobs:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
