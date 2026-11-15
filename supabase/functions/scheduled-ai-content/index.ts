import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { requireInternal } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Content topics for daily rotation
const BLOG_TOPICS = [
  "Top 10 In-Demand Skills in Albania's Job Market 2025",
  "How to Negotiate Your Salary in Albania",
  "Remote Work Opportunities in Albania",
  "Career Transition Tips for Albanian Professionals",
  "IT Job Market Trends in Tirana",
  "Best Companies to Work for in Albania",
  "Interview Tips for Albanian Job Seekers",
  "Building Your Professional Network in Albania",
  "Freelancing vs Full-Time Employment in Albania",
  "Graduate Employment Guide for Albania",
  "Work-Life Balance Tips for Albanian Professionals",
  "LinkedIn Profile Optimization for Albanian Job Market",
  "CV Writing Guide for Albanian Job Seekers",
  "Top Industries Hiring in Albania",
  "Entrepreneurship Opportunities in Albania"
];

const CITIES = ["Tirana", "Durrës", "Vlorë", "Shkodër", "Elbasan", "Korçë", "Fier", "Berat"];
const INDUSTRIES = ["Technology", "Finance", "Healthcare", "Marketing", "Tourism", "Construction", "Education", "Retail"];

interface GeneratedContent {
  type: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  metadata?: Record<string, any>;
}

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
      console.error('Image generation failed:', response.status);
      return null;
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (imageUrl) {
      console.log('Image generated successfully');
      // Persist base64 images to Cloudflare R2 (images/blog/) instead of storing raw data in the post.
      const match = typeof imageUrl === 'string' ? imageUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/) : null;
      if (match && r2Configured) {
        try {
          const ext = match[1] === 'image/jpeg' ? 'jpg' : match[1].split('/')[1];
          const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
          const key = `images/blog/scheduled-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
          return await uploadImageToR2(key, bytes, match[1]);
        } catch (e) {
          console.error('R2 upload failed, keeping inline image:', e);
        }
      }
      return imageUrl;
    }
    
    return null;
  } catch (error) {
    console.error('Error generating image:', error);
    return null;
  }
}

// Generate text content using DeepSeek
async function generateTextContent(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
  if (!DEEPSEEK_API_KEY) {
    console.error('DEEPSEEK_API_KEY not set');
    return null;
  }

  try {
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
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      console.error('DeepSeek API error:', response.status);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error('Error generating text:', error);
    return null;
  }
}

// Generate blog post
async function generateBlogPost(topic: string): Promise<GeneratedContent | null> {
  const systemPrompt = `You are an expert content writer for Jobs.al, Albania's premier job portal. 
Write engaging, SEO-optimized blog posts about the Albanian job market.
Format output as valid HTML with proper headings (h2, h3), paragraphs, lists, and tables where appropriate.
Include meta_title (under 60 chars), meta_description (under 160 chars), and excerpt (under 200 chars) at the start in JSON format.`;

  const userPrompt = `Write a comprehensive blog post about: "${topic}"
Target audience: Albanian job seekers and employers
Include practical tips, statistics (you can estimate reasonable numbers), and actionable advice.
Start with JSON metadata block like this:
{"meta_title": "...", "meta_description": "...", "excerpt": "...", "tags": ["tag1", "tag2"]}
Then write the full HTML content.`;

  const content = await generateTextContent(systemPrompt, userPrompt);
  if (!content) return null;

  // Generate featured image
  const imagePrompt = `Professional business image for blog post about ${topic}. Modern office environment, Albanian professionals, corporate setting. High quality, photorealistic, 16:9 aspect ratio.`;
  const imageUrl = await generateImage(imagePrompt);

  return {
    type: 'blog_post',
    title: topic,
    content,
    imageUrl,
    metadata: { topic }
  };
}

// Generate social media posts
async function generateSocialPosts(): Promise<GeneratedContent | null> {
  const topics = [
    "Job market update",
    "Career tip of the day",
    "Success story highlight",
    "Industry trend",
    "Job seeking motivation"
  ];
  const topic = topics[Math.floor(Math.random() * topics.length)];

  const systemPrompt = `You are a social media expert for Jobs.al, Albania's premier job portal.
Create engaging social media posts that drive engagement and traffic.
Write posts for LinkedIn, Facebook, and Instagram.
Use appropriate hashtags, emojis, and formatting for each platform.`;

  const userPrompt = `Create 3 social media posts about: "${topic}"
Format as JSON array:
[
  {"platform": "linkedin", "content": "...", "hashtags": ["#hashtag1", "#hashtag2"]},
  {"platform": "facebook", "content": "...", "hashtags": ["#hashtag1", "#hashtag2"]},
  {"platform": "instagram", "content": "...", "hashtags": ["#hashtag1", "#hashtag2"]}
]
Make them engaging, professional, and relevant to Albanian job seekers.`;

  const content = await generateTextContent(systemPrompt, userPrompt);
  if (!content) return null;

  // Generate social graphic
  const imagePrompt = `Social media graphic for ${topic}. Modern, vibrant design with Albanian professional theme. Square format, clean typography, brand colors blue and white.`;
  const imageUrl = await generateImage(imagePrompt);

  return {
    type: 'social_posts',
    title: `Social Media: ${topic}`,
    content,
    imageUrl,
    metadata: { topic }
  };
}

// Generate city employment guide
async function generateCityGuide(): Promise<GeneratedContent | null> {
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];

  const systemPrompt = `You are an expert on the Albanian job market and regional employment.
Write comprehensive city employment guides that help job seekers understand local opportunities.
Format as valid HTML with proper structure.`;

  const userPrompt = `Write a comprehensive employment guide for ${city}, Albania.
Include:
- Overview of the local job market
- Top industries and employers
- Average salary ranges
- Cost of living considerations
- Transportation and commute info
- Top companies hiring
- Tips for job seekers in ${city}

Start with JSON metadata:
{"meta_title": "...", "meta_description": "...", "excerpt": "..."}
Then write the full HTML content.`;

  const content = await generateTextContent(systemPrompt, userPrompt);
  if (!content) return null;

  const imagePrompt = `Beautiful cityscape of ${city}, Albania. Professional photography, modern urban environment, business district. High quality, wide angle, daytime.`;
  const imageUrl = await generateImage(imagePrompt);

  return {
    type: 'city_guide',
    title: `Employment Guide: ${city}`,
    content,
    imageUrl,
    metadata: { city }
  };
}

// Generate career guide
async function generateCareerGuide(): Promise<GeneratedContent | null> {
  const industry = INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)];

  const systemPrompt = `You are a career counselor specializing in the Albanian job market.
Write comprehensive career guides that help professionals navigate their industry.
Format as valid HTML with proper structure.`;

  const userPrompt = `Write a comprehensive career guide for the ${industry} industry in Albania.
Include:
- Industry overview and growth prospects
- Key roles and career paths
- Required skills and qualifications
- Salary expectations
- Top employers in Albania
- Future trends
- How to break into the industry

Start with JSON metadata:
{"meta_title": "...", "meta_description": "...", "excerpt": "..."}
Then write the full HTML content.`;

  const content = await generateTextContent(systemPrompt, userPrompt);
  if (!content) return null;

  const imagePrompt = `Professional ${industry} industry workplace in Albania. Modern office, professionals working, technology and innovation theme. High quality, photorealistic.`;
  const imageUrl = await generateImage(imagePrompt);

  return {
    type: 'career_guide',
    title: `Career Guide: ${industry}`,
    content,
    imageUrl,
    metadata: { industry }
  };
}

// Generate email newsletter content
async function generateNewsletterContent(): Promise<GeneratedContent | null> {
  const systemPrompt = `You are an email marketing specialist for Jobs.al.
Create engaging weekly newsletter content that keeps subscribers informed and engaged.
Format as valid HTML suitable for email.`;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  
  const userPrompt = `Create a weekly job digest newsletter for ${today}.
Include:
- Greeting and intro
- Featured jobs section (5 fictional but realistic job titles)
- Job market insight of the week
- Career tip
- Call to action

Format as email-friendly HTML with inline styles where necessary.`;

  const content = await generateTextContent(systemPrompt, userPrompt);
  if (!content) return null;

  return {
    type: 'newsletter',
    title: `Weekly Job Digest - ${today}`,
    content,
    metadata: { date: today }
  };
}

// Save content to database
async function saveContent(supabase: any, content: GeneratedContent): Promise<boolean> {
  try {
    // For blog posts, city guides, and career guides, save to posts table
    if (['blog_post', 'city_guide', 'career_guide'].includes(content.type)) {
      // Extract metadata from content
      let metadata = { meta_title: '', meta_description: '', excerpt: '', tags: [] };
      const jsonMatch = content.content.match(/\{[\s\S]*?"meta_title"[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          metadata = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.log('Could not parse metadata JSON');
        }
      }

      // Clean content by removing the JSON metadata block
      const cleanContent = content.content.replace(/\{[\s\S]*?"meta_title"[\s\S]*?\}/, '').trim();

      const slug = content.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + '-' + Date.now();

      // Get admin user for author_id
      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
        .limit(1)
        .single();

      if (!adminRole?.user_id) {
        console.error('No admin user found for authoring content');
        return false;
      }

      const { error } = await supabase.from('posts').insert({
        title: metadata.meta_title || content.title,
        slug,
        content: cleanContent,
        excerpt: metadata.excerpt || null,
        featured_image: content.imageUrl || null,
        category: content.type === 'blog_post' ? 'career-advice' : content.type.replace('_', '-'),
        tags: metadata.tags || [],
        meta_title: metadata.meta_title || content.title,
        meta_description: metadata.meta_description || null,
        author_id: adminRole.user_id,
        is_published: true,
        published_at: new Date().toISOString(),
        language: 'en'
      });

      if (error) {
        console.error('Error saving post:', error);
        return false;
      }
      
      console.log(`Saved ${content.type}: ${content.title}`);
      return true;
    }

    // For other content types, just log for now
    console.log(`Generated ${content.type}: ${content.title}`);
    return true;
  } catch (error) {
    console.error('Error saving content:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Determine which content to generate based on day of week
    const dayOfWeek = new Date().getDay();
    const results: GeneratedContent[] = [];

    console.log(`Starting scheduled content generation for day ${dayOfWeek}`);

    // Daily blog post (rotate through topics)
    const topicIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000)) % BLOG_TOPICS.length;
    const blogPost = await generateBlogPost(BLOG_TOPICS[topicIndex]);
    if (blogPost) {
      await saveContent(supabase, blogPost);
      results.push(blogPost);
    }

    // Daily social media posts
    const socialPosts = await generateSocialPosts();
    if (socialPosts) {
      results.push(socialPosts);
    }

    // City guide on Monday and Thursday (days 1 and 4)
    if (dayOfWeek === 1 || dayOfWeek === 4) {
      const cityGuide = await generateCityGuide();
      if (cityGuide) {
        await saveContent(supabase, cityGuide);
        results.push(cityGuide);
      }
    }

    // Career guide on Tuesday and Friday (days 2 and 5)
    if (dayOfWeek === 2 || dayOfWeek === 5) {
      const careerGuide = await generateCareerGuide();
      if (careerGuide) {
        await saveContent(supabase, careerGuide);
        results.push(careerGuide);
      }
    }

    // Newsletter content on Wednesday (day 3)
    if (dayOfWeek === 3) {
      const newsletter = await generateNewsletterContent();
      if (newsletter) {
        results.push(newsletter);
      }
    }

    console.log(`Content generation complete. Generated ${results.length} pieces of content.`);

    return new Response(
      JSON.stringify({
        success: true,
        generated: results.length,
        content: results.map(r => ({ type: r.type, title: r.title }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scheduled-ai-content:', error);
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
