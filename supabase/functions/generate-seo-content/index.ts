import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentRequest {
  type: 'blog' | 'category_page' | 'city_guide' | 'career_guide';
  topic?: string;
  category?: string;
  city?: string;
  keywords?: string[];
  language?: 'en' | 'al';
}

const ALBANIAN_CITIES = ['Tirana', 'Durres', 'Vlore', 'Shkoder', 'Elbasan', 'Korce', 'Fier', 'Berat'];
const JOB_CATEGORIES = ['Technology', 'Marketing', 'Finance', 'Healthcare', 'Education', 'Sales', 'Engineering', 'Design', 'Hospitality', 'Construction'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { action, ...params } = await req.json();

    console.log(`Content generation request: ${action}`, params);

    let result;

    switch (action) {
      case 'generate_blog':
        result = await generateBlogPost(LOVABLE_API_KEY, supabase, params);
        break;
      case 'generate_city_guide':
        result = await generateCityGuide(LOVABLE_API_KEY, supabase, params);
        break;
      case 'generate_career_guide':
        result = await generateCareerGuide(LOVABLE_API_KEY, supabase, params);
        break;
      case 'batch_generate':
        result = await batchGenerate(LOVABLE_API_KEY, supabase, params);
        break;
      case 'get_content_suggestions':
        result = await getContentSuggestions(LOVABLE_API_KEY);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Content generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateBlogPost(apiKey: string, supabase: any, params: any) {
  const { topic, keywords = [], language = 'en', category = 'Career Advice' } = params;

  const systemPrompt = `You are an expert career content writer specializing in the Albanian job market. Create SEO-optimized, engaging blog content that provides real value to job seekers and employers in Albania.

Your content must:
- Be professionally formatted with proper HTML tags (h2, h3, p, ul, li, strong, etc.)
- Include practical, actionable advice
- Reference Albanian market specifics when relevant
- Be between 1500-2500 words
- Include a compelling introduction and conclusion
- Use subheadings to break up content
- Include bullet points and numbered lists where appropriate`;

  const userPrompt = `Write a comprehensive blog post about: "${topic}"

Target keywords: ${keywords.join(', ')}
Language: ${language === 'al' ? 'Albanian' : 'English'}
Category: ${category}

The post should include:
1. An engaging title (60 chars max)
2. A meta description (155 chars max)
3. An excerpt (200 chars max)
4. The full article content in HTML format
5. 3-5 relevant tags

Return as JSON with these exact fields:
{
  "title": "...",
  "meta_title": "...",
  "meta_description": "...",
  "excerpt": "...",
  "content": "...",
  "tags": ["...", "..."],
  "meta_keywords": ["...", "..."]
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error:', errorText);
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const contentText = data.choices?.[0]?.message?.content;
  
  // Parse JSON from response
  const jsonMatch = contentText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response as JSON');
  }
  
  const blogData = JSON.parse(jsonMatch[0]);
  
  // Generate slug
  const slug = blogData.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 80);

  // Get admin user for author_id
  const { data: adminUser } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin')
    .limit(1)
    .single();

  if (!adminUser) {
    throw new Error('No admin user found to attribute blog post');
  }

  // Save to database
  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      title: blogData.title,
      slug: slug + '-' + Date.now().toString(36),
      content: blogData.content,
      excerpt: blogData.excerpt,
      category: category,
      tags: blogData.tags,
      meta_title: blogData.meta_title,
      meta_description: blogData.meta_description,
      meta_keywords: blogData.meta_keywords,
      language: language,
      author_id: adminUser.user_id,
      is_published: false, // Draft by default
      published_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Database error:', error);
    throw new Error(`Failed to save blog post: ${error.message}`);
  }

  console.log(`Blog post created: ${post.title} (${post.slug})`);
  return { success: true, post };
}

async function generateCityGuide(apiKey: string, supabase: any, params: any) {
  const { city, language = 'en' } = params;

  const systemPrompt = `You are an expert content writer creating comprehensive city employment guides for Albania. Your guides help job seekers understand the local job market, major employers, cost of living, and career opportunities in specific Albanian cities.`;

  const userPrompt = `Create a comprehensive "Working in ${city}, Albania" guide.

Include:
1. Overview of ${city}'s economy and major industries
2. Top employers and companies in ${city}
3. Most in-demand jobs and skills
4. Average salaries by industry
5. Cost of living considerations
6. Transportation and commuting
7. Quality of life factors
8. Tips for job seekers relocating to ${city}

Language: ${language === 'al' ? 'Albanian' : 'English'}

Return as JSON:
{
  "title": "Working in ${city}: Complete Job Market & Career Guide",
  "meta_title": "...",
  "meta_description": "...",
  "excerpt": "...",
  "content": "...",
  "tags": ["${city} jobs", "work in ${city}", "..."],
  "meta_keywords": ["...", "..."]
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const contentText = data.choices?.[0]?.message?.content;
  
  const jsonMatch = contentText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response');
  }
  
  const guideData = JSON.parse(jsonMatch[0]);
  
  const slug = `working-in-${city.toLowerCase()}-albania-jobs-guide`;

  const { data: adminUser } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin')
    .limit(1)
    .single();

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      title: guideData.title,
      slug: slug,
      content: guideData.content,
      excerpt: guideData.excerpt,
      category: 'City Guides',
      tags: guideData.tags,
      meta_title: guideData.meta_title,
      meta_description: guideData.meta_description,
      meta_keywords: guideData.meta_keywords,
      language: language,
      author_id: adminUser?.user_id,
      is_published: false,
      published_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  
  console.log(`City guide created: ${post.title}`);
  return { success: true, post };
}

async function generateCareerGuide(apiKey: string, supabase: any, params: any) {
  const { category, language = 'en' } = params;

  const systemPrompt = `You are an expert career counselor creating comprehensive industry career guides for the Albanian job market. Your guides help job seekers understand career paths, required skills, salary expectations, and growth opportunities in specific industries.`;

  const userPrompt = `Create a comprehensive "${category} Careers in Albania" guide.

Include:
1. Industry overview in Albania
2. Popular job titles and roles
3. Required skills and qualifications
4. Education and certification requirements
5. Salary ranges by experience level
6. Career progression paths
7. Top companies hiring in this sector
8. Future outlook and trends
9. Tips for breaking into the industry

Language: ${language === 'al' ? 'Albanian' : 'English'}

Return as JSON:
{
  "title": "${category} Careers in Albania: Complete Guide",
  "meta_title": "...",
  "meta_description": "...",
  "excerpt": "...",
  "content": "...",
  "tags": ["${category.toLowerCase()} jobs", "${category.toLowerCase()} careers albania", "..."],
  "meta_keywords": ["...", "..."]
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const contentText = data.choices?.[0]?.message?.content;
  
  const jsonMatch = contentText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response');
  }
  
  const guideData = JSON.parse(jsonMatch[0]);
  
  const slug = `${category.toLowerCase().replace(/\s+/g, '-')}-careers-albania-guide`;

  const { data: adminUser } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin')
    .limit(1)
    .single();

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      title: guideData.title,
      slug: slug,
      content: guideData.content,
      excerpt: guideData.excerpt,
      category: 'Career Guides',
      tags: guideData.tags,
      meta_title: guideData.meta_title,
      meta_description: guideData.meta_description,
      meta_keywords: guideData.meta_keywords,
      language: language,
      author_id: adminUser?.user_id,
      is_published: false,
      published_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  
  console.log(`Career guide created: ${post.title}`);
  return { success: true, post };
}

async function batchGenerate(apiKey: string, supabase: any, params: any) {
  const { types = ['city_guides', 'career_guides', 'long_tail_blogs'] } = params;
  const results: { generated: any[]; errors: any[] } = { generated: [], errors: [] };

  // Generate city guides
  if (types.includes('city_guides')) {
    for (const city of ALBANIAN_CITIES.slice(0, 3)) { // Limit to 3 for demo
      try {
        const result = await generateCityGuide(apiKey, supabase, { city });
        results.generated.push({ type: 'city_guide', city, ...result });
        await new Promise(r => setTimeout(r, 2000)); // Rate limit delay
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({ type: 'city_guide', city, error: errorMessage });
      }
    }
  }

  // Generate career guides
  if (types.includes('career_guides')) {
    for (const category of JOB_CATEGORIES.slice(0, 3)) { // Limit to 3 for demo
      try {
        const result = await generateCareerGuide(apiKey, supabase, { category });
        results.generated.push({ type: 'career_guide', category, ...result });
        await new Promise(r => setTimeout(r, 2000));
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({ type: 'career_guide', category, error: errorMessage });
      }
    }
  }

  // Generate long-tail keyword blog posts
  if (types.includes('long_tail_blogs')) {
    const longTailTopics = [
      { topic: 'How to Write a CV in Albania: Step-by-Step Guide', keywords: ['cv albania', 'how to write cv', 'albanian resume'] },
      { topic: 'Remote Work Jobs in Albania: Complete Guide 2025', keywords: ['remote jobs albania', 'work from home albania', 'online jobs'] },
      { topic: 'Entry Level Jobs in Tirana for Fresh Graduates', keywords: ['entry level jobs tirana', 'graduate jobs albania', 'first job albania'] },
    ];

    for (const blogTopic of longTailTopics) {
      try {
        const result = await generateBlogPost(apiKey, supabase, blogTopic);
        results.generated.push({ type: 'blog', ...blogTopic, ...result });
        await new Promise(r => setTimeout(r, 2000));
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({ type: 'blog', topic: blogTopic.topic, error: errorMessage });
      }
    }
  }

  console.log(`Batch generation complete: ${results.generated.length} created, ${results.errors.length} errors`);
  return results;
}

async function getContentSuggestions(apiKey: string) {
  const systemPrompt = `You are an SEO expert for the Albanian job market. Suggest blog topics and long-tail keywords that would drive organic traffic to jobs.al.`;

  const userPrompt = `Suggest 10 blog post topics for jobs.al that would rank well in search engines. Focus on:
1. Albanian job market specific topics
2. Long-tail keywords with low competition
3. Practical career advice
4. Industry-specific guides

Return as JSON array:
[
  {
    "topic": "...",
    "keywords": ["...", "..."],
    "category": "...",
    "estimated_search_volume": "low/medium/high",
    "priority": 1-10
  }
]`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const contentText = data.choices?.[0]?.message?.content;
  
  const jsonMatch = contentText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse suggestions');
  }
  
  return { suggestions: JSON.parse(jsonMatch[0]) };
}
