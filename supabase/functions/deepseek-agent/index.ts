import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { requireAdmin } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentRequest {
  type: 'job_description' | 'company_profile' | 'marketing_content' | 'social_post' | 'email_template' | 'generate_image' | 'resume_enhance';
  context: Record<string, any>;
  includeImage?: boolean;
}

// Human-style writing instructions to append to all content generation prompts
const HUMAN_STYLE_INSTRUCTIONS = `

CRITICAL WRITING RULES FOR HUMAN-LIKE, SEO-OPTIMIZED CONTENT:
1. Vary sentence length dramatically - mix short punchy sentences (5-8 words) with longer descriptive ones (20-25 words)
2. Use contractions naturally throughout (we're, you'll, it's, don't, can't)
3. Include conversational phrases and transitions ("Here's the thing...", "What you'll love about this...", "Let's be honest...")
4. Add subtle rhetorical questions to engage readers ("Sound like you?", "Ready to take the next step?")
5. Use active voice 90% of the time - make statements direct and powerful
6. Include specific, concrete details rather than vague generalities
7. AVOID these AI patterns at all costs:
   - "In today's rapidly evolving..."
   - "It's important to note that..."
   - "In conclusion..."
   - "Furthermore," "Moreover," "Additionally," at the start of sentences
   - "This comprehensive guide..."
   - "Navigate the landscape..."
8. Write with personality and occasional informal touches
9. Use em-dashes for emphasis—like this—and ellipses sparingly...
10. Include natural paragraph breaks with varied lengths (some 2 sentences, some 4-5)
11. Start some sentences with "And" or "But" for a natural flow
12. Add occasional parenthetical asides (they feel more human)
13. Use specific numbers and data points when relevant
14. Write as if you're having a conversation with a smart friend`;

const SYSTEM_PROMPTS: Record<string, string> = {
  job_description: `You are an expert HR content writer specializing in the Albanian job market. 
Create compelling, professional job descriptions that attract top talent. 
Include: job title, company overview, responsibilities, requirements, benefits, and application instructions.
Write in a clear, engaging tone. Output in HTML format with proper headings and lists.${HUMAN_STYLE_INSTRUCTIONS}`,
  
  company_profile: `You are a professional business writer creating company profiles for Jobs.al.
Write engaging, SEO-optimized company descriptions that highlight company culture, values, achievements, and workplace benefits.
Output in HTML format suitable for a company profile page.${HUMAN_STYLE_INSTRUCTIONS}`,
  
  marketing_content: `You are a digital marketing specialist for Jobs.al, Albania's premier job portal.
Create compelling marketing content that drives engagement and conversions.
Focus on value propositions, user benefits, and clear calls-to-action.
Output in HTML format.${HUMAN_STYLE_INSTRUCTIONS}`,
  
  social_post: `You are a social media expert creating content for Jobs.al.
Write engaging, shareable posts for LinkedIn, Facebook, and Instagram.
Use appropriate hashtags, emojis, and formatting for each platform.
Keep posts concise but impactful.${HUMAN_STYLE_INSTRUCTIONS}`,
  
  email_template: `You are an email marketing specialist for Jobs.al.
Create professional, conversion-focused email templates.
Include compelling subject lines, clear value propositions, and strong CTAs.
Output in HTML email format with inline styles.${HUMAN_STYLE_INSTRUCTIONS}`,
  
  resume_enhance: `You are a professional resume writer and career coach.
Enhance resume content to be more impactful, achievement-focused, and ATS-optimized.
Use strong action verbs and quantify achievements where possible.${HUMAN_STYLE_INSTRUCTIONS}`
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
  contentUrl?: string;
  requestPreview?: string;
  responsePreview?: string;
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
      content_url: params.contentUrl,
      request_preview: params.requestPreview?.substring(0, 500),
      response_preview: params.responsePreview?.substring(0, 500),
    });
  } catch (error) {
    console.error('Failed to log API call:', error);
  }
}

// Calculate cost based on tokens
function calculateCost(agentType: string, promptTokens: number, completionTokens: number): number {
  if (agentType === 'deepseek') {
    // DeepSeek pricing: $0.07/1M input, $0.14/1M output
    const inputCost = (promptTokens / 1000000) * 0.07;
    const outputCost = (completionTokens / 1000000) * 0.14;
    return inputCost + outputCost;
  } else if (agentType === 'lovable') {
    // Lovable/Gemini Flash pricing: $0.075/1M input, $0.30/1M output
    const inputCost = (promptTokens / 1000000) * 0.075;
    const outputCost = (completionTokens / 1000000) * 0.30;
    return inputCost + outputCost;
  }
  return 0;
}

// Generate image using Lovable AI
async function generateImage(prompt: string): Promise<{ url: string | null; durationMs: number }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const startTime = Date.now();
  
  if (!LOVABLE_API_KEY) {
    console.log('LOVABLE_API_KEY not set, skipping image generation');
    return { url: null, durationMs: 0 };
  }

  try {
    console.log('Generating image with Lovable AI:', prompt);
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Image generation failed:', response.status, errorText);
      await logAPICall({
        agentType: 'lovable',
        contentType: 'image',
        promptTokens: prompt.length / 4,
        completionTokens: 0,
        cost: 0,
        durationMs,
        status: 'failed',
        errorMessage: errorText,
        requestPreview: prompt,
      });
      return { url: null, durationMs };
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    // Estimate tokens for image generation
    const estimatedTokens = Math.ceil(prompt.length / 4);
    
    await logAPICall({
      agentType: 'lovable',
      contentType: 'image',
      promptTokens: estimatedTokens,
      completionTokens: 1000, // Estimated for image generation
      cost: calculateCost('lovable', estimatedTokens, 1000),
      durationMs,
      status: imageUrl ? 'success' : 'failed',
      requestPreview: prompt,
      responsePreview: imageUrl ? 'Image generated successfully' : 'No image in response',
    });
    
    if (imageUrl) {
      console.log('Image generated successfully');
      return { url: imageUrl, durationMs };
    }
    
    return { url: null, durationMs };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error('Error generating image:', error);
    await logAPICall({
      agentType: 'lovable',
      contentType: 'image',
      promptTokens: 0,
      completionTokens: 0,
      cost: 0,
      durationMs,
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      requestPreview: prompt,
    });
    return { url: null, durationMs };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const authorizationCheck = await requireAdmin(req);
    if (!authorizationCheck.ok) return authorizationCheck.response;
    const { type, context, includeImage }: ContentRequest = await req.json();

    // Handle image-only generation
    if (type === 'generate_image') {
      const imagePrompt = context.prompt || 'Professional business image for Albanian job market';
      const { url: imageUrl, durationMs } = await generateImage(imagePrompt);
      
      if (!imageUrl) {
        throw new Error('Failed to generate image');
      }

      return new Response(
        JSON.stringify({
          success: true,
          type: 'generate_image',
          imageUrl,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
    if (!DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }
    
    if (!type || !SYSTEM_PROMPTS[type]) {
      throw new Error(`Invalid content type. Valid types: ${Object.keys(SYSTEM_PROMPTS).join(', ')}, generate_image`);
    }

    const systemPrompt = SYSTEM_PROMPTS[type];
    
    // Build user prompt based on content type and context
    let userPrompt = '';
    let imagePrompt = '';
    
    switch (type) {
      case 'job_description':
        userPrompt = `Create a job description for:
- Position: ${context.title || 'Not specified'}
- Company: ${context.company || 'Not specified'}
- Location: ${context.location || 'Albania'}
- Job Type: ${context.jobType || 'Full-time'}
- Experience Level: ${context.experienceLevel || 'Mid-level'}
- Key Skills: ${context.skills?.join(', ') || 'Not specified'}
- Additional Info: ${context.additionalInfo || 'None'}

Remember to write in a natural, human voice - avoid AI patterns!`;
        imagePrompt = `Professional workplace image for ${context.title || 'job'} position at ${context.company || 'company'}. Modern office, Albanian professionals, corporate setting. High quality, photorealistic.`;
        break;
        
      case 'company_profile':
        userPrompt = `Create a company profile for:
- Company Name: ${context.companyName || 'Not specified'}
- Industry: ${context.industry || 'Not specified'}
- Size: ${context.size || 'Not specified'}
- Location: ${context.location || 'Albania'}
- Key Values: ${context.values?.join(', ') || 'Innovation, Quality'}
- Additional Info: ${context.additionalInfo || 'None'}

Write with personality and authentic voice - not corporate speak!`;
        imagePrompt = `Professional company banner for ${context.companyName || 'company'} in ${context.industry || 'business'} industry. Modern office building, corporate identity, professional team. High quality, wide format.`;
        break;
        
      case 'marketing_content':
        userPrompt = `Create marketing content for:
- Purpose: ${context.purpose || 'General promotion'}
- Target Audience: ${context.audience || 'Job seekers and employers'}
- Key Message: ${context.message || 'Find your dream job in Albania'}
- Tone: ${context.tone || 'Professional and friendly'}
- Call to Action: ${context.cta || 'Sign up today'}

Make it punchy and compelling - not generic marketing speak!`;
        imagePrompt = `Marketing banner for Jobs.al job portal. ${context.purpose || 'Professional careers'}. Modern design, Albanian professionals, success theme. Vibrant colors, high quality.`;
        break;
        
      case 'social_post':
        userPrompt = `Create social media posts for:
- Platform: ${context.platform || 'LinkedIn, Facebook, Instagram'}
- Topic: ${context.topic || 'Job market trends'}
- Key Message: ${context.message || 'Jobs.al updates'}
- Include Statistics: ${context.includeStats ? 'Yes' : 'No'}

Write like a real person would - conversational and engaging!`;
        imagePrompt = `Social media graphic for ${context.topic || 'job market'}. Modern, vibrant design. Albanian professional theme. Square format, clean typography, blue and white colors.`;
        break;
        
      case 'email_template':
        userPrompt = `Create an email template for:
- Purpose: ${context.purpose || 'Newsletter'}
- Target: ${context.target || 'All subscribers'}
- Key Message: ${context.message || 'Latest job opportunities'}
- CTA: ${context.cta || 'View Jobs'}

Write a subject line that people actually want to open - not spammy!`;
        imagePrompt = `Email header banner for Jobs.al newsletter. ${context.purpose || 'Job updates'}. Professional, clean design, Albanian job market theme. Wide format, minimal.`;
        break;
        
      case 'resume_enhance':
        userPrompt = `Enhance this resume content:
- Section Type: ${context.sectionType || 'general'}
- Content: ${context.content || 'Not provided'}
- Target Role: ${context.targetRole || 'Not specified'}
- Industry: ${context.industry || 'General'}

Make it impactful and achievement-focused. Use strong action verbs!`;
        break;
    }

    console.log(`Generating ${type} content with DeepSeek...`);

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8, // Slightly higher for more natural variation
        max_tokens: 2000,
      }),
    });

    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      
      await logAPICall({
        agentType: 'deepseek',
        contentType: type,
        promptTokens: 0,
        completionTokens: 0,
        cost: 0,
        durationMs,
        status: 'failed',
        errorMessage: errorText,
        requestPreview: userPrompt,
      });
      
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content;
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };

    if (!generatedContent) {
      throw new Error('No content generated from DeepSeek');
    }

    // Log the successful API call
    await logAPICall({
      agentType: 'deepseek',
      contentType: type,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      cost: calculateCost('deepseek', usage.prompt_tokens, usage.completion_tokens),
      durationMs,
      status: 'success',
      requestPreview: userPrompt,
      responsePreview: generatedContent,
    });

    console.log(`Successfully generated ${type} content`);

    // Generate image if requested
    let imageUrl = null;
    if (includeImage && imagePrompt) {
      const { url } = await generateImage(imagePrompt);
      imageUrl = url;
    }

    return new Response(
      JSON.stringify({
        success: true,
        type,
        content: generatedContent,
        imageUrl,
        usage: data.usage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error('Error in deepseek-agent:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
