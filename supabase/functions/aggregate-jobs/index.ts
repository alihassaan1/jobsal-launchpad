import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Job sources to aggregate from
const JOB_SOURCES = [
  { name: "duapune.com", url: "https://duapune.com/jobs" },
  { name: "karriere.al", url: "https://karriere.al" },
];

interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements?: string;
  salary?: string;
  jobType?: string;
  sourceUrl: string;
  sourcePlatform: string;
}

// Log API call to database
async function logAPICall(
  supabase: any,
  params: {
    agentType: string;
    contentType: string;
    promptTokens: number;
    completionTokens: number;
    cost: number;
    durationMs: number;
    status: "success" | "failed";
    errorMessage?: string;
    contentUrl?: string;
    requestPreview?: string;
    responsePreview?: string;
  }
) {
  try {
    await supabase.from("ai_agent_logs").insert({
      agent_type: params.agentType,
      content_type: params.contentType,
      prompt_tokens: params.promptTokens,
      completion_tokens: params.completionTokens,
      total_tokens: params.promptTokens + params.completionTokens,
      cost: params.cost,
      duration_ms: params.durationMs,
      status: params.status,
      error_message: params.errorMessage || null,
      content_url: params.contentUrl || null,
      request_preview: params.requestPreview?.substring(0, 500) || null,
      response_preview: params.responsePreview?.substring(0, 500) || null,
    });
  } catch (error) {
    console.error("Failed to log API call:", error);
  }
}

// Calculate cost based on tokens (DeepSeek pricing)
function calculateCost(promptTokens: number, completionTokens: number): number {
  // DeepSeek pricing: $0.07/1M input, $0.14/1M output
  const inputCost = (promptTokens / 1000000) * 0.07;
  const outputCost = (completionTokens / 1000000) * 0.14;
  return inputCost + outputCost;
}

// Rewrite job description using DeepSeek with human-style writing
async function rewriteJobDescription(
  job: ScrapedJob,
  supabase: any
): Promise<{ rewritten: ScrapedJob; tokens: { prompt: number; completion: number } } | null> {
  const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
  if (!DEEPSEEK_API_KEY) {
    console.error("DEEPSEEK_API_KEY not set");
    return null;
  }

  const startTime = Date.now();
  const systemPrompt = `You are an expert HR content writer for Jobs.al, Albania's premier job portal.
Your task is to rewrite job descriptions to make them more engaging and SEO-optimized.

CRITICAL WRITING RULES FOR HUMAN-LIKE CONTENT:
1. Vary sentence length - mix short punchy sentences with longer descriptive ones
2. Use contractions naturally (we're, you'll, it's)
3. Include conversational phrases ("Here's the thing...", "What you'll love...")
4. Add subtle rhetorical questions to engage readers
5. Use active voice predominantly
6. Include specific, concrete details rather than vague statements
7. Avoid AI patterns like "In today's rapidly evolving...", "It's important to note...", "In conclusion..."
8. Don't overuse transition words like "Furthermore", "Moreover", "Additionally"
9. Include natural paragraph breaks and varied formatting
10. Write as if you're a real HR professional, not an AI

Output in clean HTML format suitable for job listings.`;

  const userPrompt = `Rewrite this job listing in a natural, human voice:

Original Job:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Description: ${job.description}
${job.requirements ? `Requirements: ${job.requirements}` : ""}
${job.salary ? `Salary: ${job.salary}` : ""}

Create a compelling, SEO-friendly job description that:
- Sounds like it was written by a real person
- Highlights the role's appeal
- Is optimized for Albanian job seekers
- Uses proper HTML formatting

Return ONLY a JSON object:
{
  "title": "optimized job title",
  "description": "full HTML job description",
  "requirements": "HTML formatted requirements",
  "skills": ["skill1", "skill2", "skill3"],
  "benefits": ["benefit1", "benefit2"],
  "category": "appropriate category"
}`;

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      const error = await response.text();
      await logAPICall(supabase, {
        agentType: "deepseek",
        contentType: "job_rewrite",
        promptTokens: 0,
        completionTokens: 0,
        cost: 0,
        durationMs,
        status: "failed",
        errorMessage: error,
        requestPreview: userPrompt,
      });
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };

    await logAPICall(supabase, {
      agentType: "deepseek",
      contentType: "job_rewrite",
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      cost: calculateCost(usage.prompt_tokens, usage.completion_tokens),
      durationMs,
      status: "success",
      requestPreview: userPrompt,
      responsePreview: content,
    });

    if (!content) return null;

    // Parse the JSON response
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanContent);

    return {
      rewritten: {
        ...job,
        title: parsed.title || job.title,
        description: parsed.description || job.description,
        requirements: parsed.requirements,
      },
      tokens: {
        prompt: usage.prompt_tokens,
        completion: usage.completion_tokens,
      },
    };
  } catch (error) {
    console.error("Error rewriting job:", error);
    return null;
  }
}

// Check if job already exists to avoid duplicates
async function jobExists(
  supabase: any,
  title: string,
  company: string
): Promise<boolean> {
  const { data } = await supabase
    .from("jobs")
    .select("id")
    .ilike("title", title)
    .limit(1);

  return (data?.length || 0) > 0;
}

// Mock function to simulate job scraping (replace with actual scraping logic)
async function scrapeJobsFromSource(source: typeof JOB_SOURCES[0]): Promise<ScrapedJob[]> {
  // In production, this would use Firecrawl or similar to scrape actual job listings
  // For now, we return empty array as this is a framework
  console.log(`Would scrape jobs from: ${source.name}`);
  return [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { sources, limit = 10 } = await req.json().catch(() => ({ sources: JOB_SOURCES, limit: 10 }));

    console.log("Starting job aggregation...");
    const results = {
      processed: 0,
      added: 0,
      skipped: 0,
      errors: 0,
    };

    // Get admin user for posting jobs
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .single();

    if (!adminRole?.user_id) {
      throw new Error("No admin user found for posting jobs");
    }

    // Get or create a default company for aggregated jobs
    let { data: defaultCompany } = await supabase
      .from("companies")
      .select("id")
      .eq("slug", "jobs-al-aggregated")
      .single();

    if (!defaultCompany) {
      const { data: newCompany, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: "Jobs.al Aggregated",
          slug: "jobs-al-aggregated",
          description: "Jobs aggregated from various Albanian job portals",
          owner_id: adminRole.user_id,
          is_verified: true,
        })
        .select()
        .single();

      if (companyError) throw companyError;
      defaultCompany = newCompany;
    }

    // Process each source
    for (const source of sources) {
      try {
        const jobs = await scrapeJobsFromSource(source);
        
        for (const job of jobs.slice(0, limit)) {
          results.processed++;

          // Check for duplicates
          if (await jobExists(supabase, job.title, job.company)) {
            results.skipped++;
            continue;
          }

          // Rewrite job description
          const rewritten = await rewriteJobDescription(job, supabase);
          if (!rewritten) {
            results.errors++;
            continue;
          }

          // Create slug
          const slug = `${rewritten.rewritten.title}-${rewritten.rewritten.company}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") + "-" + Date.now();

          // Insert job
          const { error: insertError } = await supabase.from("jobs").insert({
            title: rewritten.rewritten.title,
            slug,
            description: rewritten.rewritten.description,
            requirements: rewritten.rewritten.requirements,
            location: job.location || "Albania",
            company_id: defaultCompany?.id,
            posted_by: adminRole.user_id,
            category: "General",
            job_type: "full_time",
            experience_level: "mid",
            is_active: true,
          });

          if (insertError) {
            console.error("Error inserting job:", insertError);
            results.errors++;
          } else {
            results.added++;
          }
        }
      } catch (error) {
        console.error(`Error processing source ${source.name}:`, error);
        results.errors++;
      }
    }

    console.log("Job aggregation complete:", results);

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in aggregate-jobs:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
