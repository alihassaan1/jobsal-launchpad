import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "work_experience") {
      systemPrompt = "You are an expert resume writer. Generate 3-5 professional, action-oriented bullet points for the given work experience. Use strong action verbs and quantify achievements where possible.";
      userPrompt = `Job title and description: ${text}\n\nGenerate professional bullet points that highlight achievements and responsibilities.`;
    } else if (type === "skills") {
      systemPrompt = "You are a career advisor. Based on the job title provided, suggest 8-12 relevant technical and soft skills that would be valuable for this role.";
      userPrompt = `Job title: ${text}\n\nSuggest relevant skills.`;
    } else if (type === "summary") {
      systemPrompt = "You are a professional resume writer. Create a compelling 2-3 sentence professional summary based on the candidate's information.";
      userPrompt = `Candidate info: ${text}\n\nWrite a professional summary.`;
    } else if (type === "ats_optimize") {
      systemPrompt = "You are an ATS (Applicant Tracking System) expert. Review the resume content and provide 3-5 specific suggestions to improve ATS compatibility and keyword optimization.";
      userPrompt = `Resume content: ${text}\n\nProvide ATS optimization suggestions.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to enhance resume content");
    }

    const data = await response.json();
    const enhancedText = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ enhancedText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in enhance-resume function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});