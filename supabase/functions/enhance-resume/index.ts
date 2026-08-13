import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client for logging
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (supabaseUrl && supabaseKey) {
    return createClient(supabaseUrl, supabaseKey);
  }
  return null;
}

// Admin-controlled settings for the AI resume builder
const SETTING_DEFAULTS: Record<string, string> = {
  resume_ai_enabled: 'true',
  resume_ai_summary_enabled: 'true',
  resume_ai_skills_enabled: 'true',
  resume_ai_experience_enabled: 'true',
  resume_ai_cover_letter_enabled: 'true',
  resume_ai_model: 'deepseek-chat',
  resume_ai_daily_limit: '20',
};

async function getResumeAISettings(): Promise<Record<string, string>> {
  const supabase = getSupabaseClient();
  if (!supabase) return { ...SETTING_DEFAULTS };
  try {
    const { data } = await supabase
      .from('admin_settings')
      .select('key, value')
      .like('key', 'resume_ai_%');
    const merged = { ...SETTING_DEFAULTS };
    (data || []).forEach((row: { key: string; value: string | null }) => {
      if (row.value) merged[row.key] = row.value;
    });
    return merged;
  } catch (_error) {
    return { ...SETTING_DEFAULTS };
  }
}

function settingKeyForType(type: string): string | null {
  switch (type) {
    case 'summary': return 'resume_ai_summary_enabled';
    case 'skills': return 'resume_ai_skills_enabled';
    case 'work_experience': return 'resume_ai_experience_enabled';
    case 'cover_letter': return 'resume_ai_cover_letter_enabled';
    default: return null;
  }
}

async function getUserId(req: Request): Promise<string | null> {
  const supabase = getSupabaseClient();
  const authHeader = req.headers.get('Authorization');
  if (!supabase || !authHeader) return null;
  try {
    const { data } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    return data.user?.id ?? null;
  } catch (_error) {
    return null;
  }
}

async function countTodayUsage(userId: string): Promise<number> {
  const supabase = getSupabaseClient();
  if (!supabase) return 0;
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('ai_agent_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'success')
    .like('content_type', 'resume_%')
    .gte('created_at', startOfDay.toISOString());
  return count || 0;
}

// Log API call to database
async function logAPICall(params: {
  agentType: string;
  contentType: string;
  promptTokens: number;
  completionTokens: number;
  cost: number;
  durationMs: number;
  status: 'success' | 'failed';
  errorMessage?: string;
  requestPreview?: string;
  responsePreview?: string;
  userId?: string | null;
}) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase.from('ai_agent_logs').insert({
      agent_type: params.agentType,
      content_type: params.contentType,
      prompt_tokens: params.promptTokens,
      completion_tokens: params.completionTokens,
      total_tokens: params.promptTokens + params.completionTokens,
      cost: params.cost,
      duration_ms: params.durationMs,
      status: params.status,
      error_message: params.errorMessage,
      request_preview: params.requestPreview?.substring(0, 500),
      response_preview: params.responsePreview?.substring(0, 500),
      user_id: params.userId ?? null,
    });
  } catch (error) {
    console.error('Failed to log API call:', error);
  }
}

// Calculate cost based on tokens - now using DeepSeek pricing
function calculateCost(promptTokens: number, completionTokens: number): number {
  // DeepSeek pricing: $0.07/1M input, $0.14/1M output
  const inputCost = (promptTokens / 1000000) * 0.07;
  const outputCost = (completionTokens / 1000000) * 0.14;
  return inputCost + outputCost;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { text, type, targetRole, industry } = await req.json();

    const settings = await getResumeAISettings();
    const userId = await getUserId(req);

    if (settings.resume_ai_enabled !== 'true') {
      return new Response(
        JSON.stringify({ error: "AI resume features are currently disabled by the administrator." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const featureKey = settingKeyForType(type);
    if (featureKey && settings[featureKey] !== 'true') {
      return new Response(
        JSON.stringify({ error: "This AI feature is currently disabled by the administrator." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const dailyLimit = parseInt(settings.resume_ai_daily_limit || '0', 10);
    if (userId && dailyLimit > 0) {
      const used = await countTodayUsage(userId);
      if (used >= dailyLimit) {
        return new Response(
          JSON.stringify({
            error: `You have reached your daily limit of ${dailyLimit} AI generations. Please try again tomorrow.`,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const configuredModel = settings.resume_ai_model || 'deepseek-chat';
    // Honour the admin-selected model, falling back to whichever key exists
    const useDeepSeek = configuredModel.startsWith('deepseek')
      ? !!DEEPSEEK_API_KEY
      : !LOVABLE_API_KEY && !!DEEPSEEK_API_KEY;

    if (!DEEPSEEK_API_KEY && !LOVABLE_API_KEY) {
      throw new Error("No AI API key is configured");
    }

    let systemPrompt = "";
    let userPrompt = "";
    const contentType = `resume_${type}`;

    // Enhanced prompts with human-style writing instructions
    const humanStyleInstructions = `
Write in a natural, professional voice that sounds human:
- Use varied sentence structures
- Be specific and quantify achievements when possible
- Use strong action verbs
- Avoid generic phrases and buzzwords
- Make it sound like a real professional wrote it`;

    if (type === "work_experience") {
      systemPrompt = `You are an expert resume writer. Generate 3-5 professional, action-oriented bullet points for the given work experience. Use strong action verbs and quantify achievements where possible. ${humanStyleInstructions}`;
      userPrompt = `Job title and description: ${text}
${targetRole ? `Target role: ${targetRole}` : ''}
${industry ? `Industry: ${industry}` : ''}

Generate professional bullet points that highlight achievements and responsibilities. Focus on measurable impact.`;
    } else if (type === "skills") {
      systemPrompt = `You are a career advisor. Based on the job title provided, suggest 8-12 relevant technical and soft skills that would be valuable for this role. ${humanStyleInstructions}`;
      userPrompt = `Job title: ${text}
${targetRole ? `Target role: ${targetRole}` : ''}
${industry ? `Industry: ${industry}` : ''}

Suggest relevant skills that are in-demand for this role in the current job market.`;
    } else if (type === "summary") {
      systemPrompt = `You are a professional resume writer. Create a compelling 2-3 sentence professional summary based on the candidate's information. ${humanStyleInstructions}`;
      userPrompt = `Candidate info: ${text}
${targetRole ? `Target role: ${targetRole}` : ''}
${industry ? `Industry: ${industry}` : ''}

Write a professional summary that highlights their unique value proposition.`;
    } else if (type === "ats_optimize") {
      systemPrompt = `You are an ATS (Applicant Tracking System) expert. Review the resume content and provide 3-5 specific suggestions to improve ATS compatibility and keyword optimization. ${humanStyleInstructions}`;
      userPrompt = `Resume content: ${text}
${targetRole ? `Target role: ${targetRole}` : ''}
${industry ? `Industry: ${industry}` : ''}

Provide ATS optimization suggestions with specific keywords to include.`;
    } else if (type === "cover_letter") {
      systemPrompt = `You are a professional cover letter writer. Create a compelling, personalized cover letter that showcases the candidate's fit for the role. ${humanStyleInstructions}`;
      userPrompt = `Candidate info: ${text}
${targetRole ? `Target role: ${targetRole}` : ''}
${industry ? `Industry: ${industry}` : ''}

Write a cover letter that's engaging and shows genuine interest in the role.`;
    } else if (type === "full_resume") {
      systemPrompt = `You are an expert resume writer. Create a comprehensive, ATS-optimized resume based on the provided information. Format in clean, structured sections. ${humanStyleInstructions}`;
      userPrompt = `Candidate info: ${text}
${targetRole ? `Target role: ${targetRole}` : ''}
${industry ? `Industry: ${industry}` : ''}

Create a complete resume with Summary, Experience, Skills, and Education sections.`;
    }

    let response;
    let agentType: string;

    if (useDeepSeek) {
      agentType = 'deepseek';
      response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: configuredModel.startsWith('deepseek') ? configuredModel : 'deepseek-chat',
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });
    } else {
      agentType = 'lovable';
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: configuredModel.startsWith('google/') ? configuredModel : 'google/gemini-2.5-flash',
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
        }),
      });
    }

    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      if (response.status === 429) {
        await logAPICall({
          agentType,
          contentType,
          promptTokens: 0,
          completionTokens: 0,
          cost: 0,
          durationMs,
          status: 'failed',
          errorMessage: 'Rate limit exceeded',
          requestPreview: userPrompt,
          userId,
        });
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        await logAPICall({
          agentType,
          contentType,
          promptTokens: 0,
          completionTokens: 0,
          cost: 0,
          durationMs,
          status: 'failed',
          errorMessage: 'AI credits exhausted',
          requestPreview: userPrompt,
          userId,
        });
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      await logAPICall({
        agentType,
        contentType,
        promptTokens: 0,
        completionTokens: 0,
        cost: 0,
        durationMs,
        status: 'failed',
        errorMessage: errorText,
        requestPreview: userPrompt,
        userId,
      });
      
      throw new Error("Failed to enhance resume content");
    }

    const data = await response.json();
    const enhancedText = data.choices[0].message.content;
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };

    // Log successful API call
    await logAPICall({
      agentType,
      contentType,
      promptTokens: usage.prompt_tokens || Math.ceil(userPrompt.length / 4),
      completionTokens: usage.completion_tokens || Math.ceil(enhancedText.length / 4),
      cost: calculateCost(
        usage.prompt_tokens || Math.ceil(userPrompt.length / 4),
        usage.completion_tokens || Math.ceil(enhancedText.length / 4)
      ),
      durationMs,
      status: 'success',
      requestPreview: userPrompt,
      userId,
      responsePreview: enhancedText,
    });

    return new Response(
      JSON.stringify({ 
        enhancedText,
        usage: {
          prompt_tokens: usage.prompt_tokens,
          completion_tokens: usage.completion_tokens,
          total_tokens: (usage.prompt_tokens || 0) + (usage.completion_tokens || 0)
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error("Error in enhance-resume function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
