import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentRequest {
  type: 'job_description' | 'company_profile' | 'marketing_content' | 'social_post' | 'email_template' | 'generate_image';
  context: Record<string, any>;
  includeImage?: boolean;
}

const SYSTEM_PROMPTS: Record<string, string> = {
  job_description: `You are an expert HR content writer specializing in the Albanian job market. 
Create compelling, professional job descriptions that attract top talent. 
Include: job title, company overview, responsibilities, requirements, benefits, and application instructions.
Write in a clear, engaging tone. Output in HTML format with proper headings and lists.`,
  
  company_profile: `You are a professional business writer creating company profiles for Jobs.al.
Write engaging, SEO-optimized company descriptions that highlight company culture, values, achievements, and workplace benefits.
Output in HTML format suitable for a company profile page.`,
  
  marketing_content: `You are a digital marketing specialist for Jobs.al, Albania's premier job portal.
Create compelling marketing content that drives engagement and conversions.
Focus on value propositions, user benefits, and clear calls-to-action.
Output in HTML format.`,
  
  social_post: `You are a social media expert creating content for Jobs.al.
Write engaging, shareable posts for LinkedIn, Facebook, and Instagram.
Use appropriate hashtags, emojis, and formatting for each platform.
Keep posts concise but impactful.`,
  
  email_template: `You are an email marketing specialist for Jobs.al.
Create professional, conversion-focused email templates.
Include compelling subject lines, clear value propositions, and strong CTAs.
Output in HTML email format with inline styles.`
};

// Generate image using Lovable AI
async function generateImage(prompt: string): Promise<string | null> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.log('LOVABLE_API_KEY not set, skipping image generation');
    return null;
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
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Image generation failed:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (imageUrl) {
      console.log('Image generated successfully');
      return imageUrl;
    }
    
    return null;
  } catch (error) {
    console.error('Error generating image:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, context, includeImage }: ContentRequest = await req.json();

    // Handle image-only generation
    if (type === 'generate_image') {
      const imagePrompt = context.prompt || 'Professional business image for Albanian job market';
      const imageUrl = await generateImage(imagePrompt);
      
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
- Additional Info: ${context.additionalInfo || 'None'}`;
        imagePrompt = `Professional workplace image for ${context.title || 'job'} position at ${context.company || 'company'}. Modern office, Albanian professionals, corporate setting. High quality, photorealistic.`;
        break;
        
      case 'company_profile':
        userPrompt = `Create a company profile for:
- Company Name: ${context.companyName || 'Not specified'}
- Industry: ${context.industry || 'Not specified'}
- Size: ${context.size || 'Not specified'}
- Location: ${context.location || 'Albania'}
- Key Values: ${context.values?.join(', ') || 'Innovation, Quality'}
- Additional Info: ${context.additionalInfo || 'None'}`;
        imagePrompt = `Professional company banner for ${context.companyName || 'company'} in ${context.industry || 'business'} industry. Modern office building, corporate identity, professional team. High quality, wide format.`;
        break;
        
      case 'marketing_content':
        userPrompt = `Create marketing content for:
- Purpose: ${context.purpose || 'General promotion'}
- Target Audience: ${context.audience || 'Job seekers and employers'}
- Key Message: ${context.message || 'Find your dream job in Albania'}
- Tone: ${context.tone || 'Professional and friendly'}
- Call to Action: ${context.cta || 'Sign up today'}`;
        imagePrompt = `Marketing banner for Jobs.al job portal. ${context.purpose || 'Professional careers'}. Modern design, Albanian professionals, success theme. Vibrant colors, high quality.`;
        break;
        
      case 'social_post':
        userPrompt = `Create social media posts for:
- Platform: ${context.platform || 'LinkedIn, Facebook, Instagram'}
- Topic: ${context.topic || 'Job market trends'}
- Key Message: ${context.message || 'Jobs.al updates'}
- Include Statistics: ${context.includeStats ? 'Yes' : 'No'}`;
        imagePrompt = `Social media graphic for ${context.topic || 'job market'}. Modern, vibrant design. Albanian professional theme. Square format, clean typography, blue and white colors.`;
        break;
        
      case 'email_template':
        userPrompt = `Create an email template for:
- Purpose: ${context.purpose || 'Newsletter'}
- Target: ${context.target || 'All subscribers'}
- Key Message: ${context.message || 'Latest job opportunities'}
- CTA: ${context.cta || 'View Jobs'}`;
        imagePrompt = `Email header banner for Jobs.al newsletter. ${context.purpose || 'Job updates'}. Professional, clean design, Albanian job market theme. Wide format, minimal.`;
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
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content;

    if (!generatedContent) {
      throw new Error('No content generated from DeepSeek');
    }

    console.log(`Successfully generated ${type} content`);

    // Generate image if requested
    let imageUrl = null;
    if (includeImage && imagePrompt) {
      imageUrl = await generateImage(imagePrompt);
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