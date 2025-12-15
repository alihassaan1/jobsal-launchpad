import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Content queue configuration for maximum SEO coverage
const CONTENT_QUEUE = {
  // Long-tail keyword blog posts optimized for CTR
  longTailBlogs: [
    { topic: "How to Write a CV in Albania 2025", keywords: "cv writing albania, albanian cv format, resume tips albania" },
    { topic: "Best Entry Level Jobs in Tirana for Graduates", keywords: "entry level jobs tirana, graduate jobs albania, first job albania" },
    { topic: "Remote Work Jobs in Albania: Complete Guide", keywords: "remote work albania, work from home albania, telecommute jobs" },
    { topic: "Average Salaries in Albania by Industry 2025", keywords: "salary guide albania, albanian wages, income albania" },
    { topic: "How to Get a Job Without Experience in Albania", keywords: "no experience jobs albania, first job tips, career start albania" },
    { topic: "Top 10 In-Demand Skills in Albanian Job Market", keywords: "in-demand skills albania, job skills 2025, career skills" },
    { topic: "Interview Tips for Albanian Companies", keywords: "interview tips albania, job interview questions, interview preparation" },
    { topic: "Best Companies to Work for in Albania 2025", keywords: "best employers albania, top companies tirana, great workplaces" },
    { topic: "Freelancing in Albania: Tax and Legal Guide", keywords: "freelancing albania, freelance taxes, self-employed albania" },
    { topic: "IT Jobs in Albania: Salary and Opportunities", keywords: "it jobs albania, tech jobs tirana, software developer albania" },
    { topic: "Banking and Finance Careers in Albania", keywords: "banking jobs albania, finance careers, bank teller jobs" },
    { topic: "Tourism and Hospitality Jobs in Albania", keywords: "tourism jobs albania, hotel jobs, hospitality careers" },
    { topic: "Healthcare Jobs in Albania: Requirements and Salaries", keywords: "healthcare jobs albania, nursing jobs, medical careers" },
    { topic: "Teaching Jobs in Albania: Public vs Private Schools", keywords: "teaching jobs albania, teacher salary, education careers" },
    { topic: "Construction Jobs in Albania: Growth and Opportunities", keywords: "construction jobs albania, building jobs, engineering careers" },
  ],
  
  // City guides for all major Albanian cities
  cityGuides: [
    { city: "Tirana", region: "Central Albania" },
    { city: "Durres", region: "Western Albania" },
    { city: "Vlore", region: "Southern Albania" },
    { city: "Shkoder", region: "Northern Albania" },
    { city: "Elbasan", region: "Central Albania" },
    { city: "Korce", region: "Southeastern Albania" },
    { city: "Fier", region: "Western Albania" },
    { city: "Berat", region: "Central Albania" },
  ],
  
  // Career guides for major job categories
  careerGuides: [
    { industry: "Technology & IT", slug: "technology" },
    { industry: "Finance & Banking", slug: "finance" },
    { industry: "Marketing & Sales", slug: "marketing" },
    { industry: "Healthcare & Medical", slug: "healthcare" },
    { industry: "Education & Training", slug: "education" },
    { industry: "Tourism & Hospitality", slug: "tourism" },
    { industry: "Construction & Engineering", slug: "construction" },
    { industry: "Retail & Commerce", slug: "retail" },
    { industry: "Manufacturing & Production", slug: "manufacturing" },
    { industry: "Legal & Consulting", slug: "legal" },
  ]
};

// CTR-optimized title patterns
const CTR_TITLE_PATTERNS = [
  "{topic} (Updated {year})",
  "The Ultimate Guide to {topic}",
  "{number} Proven Ways to {benefit}",
  "How to {action} in Albania: Step-by-Step Guide",
  "{topic}: Everything You Need to Know in {year}",
];

// CTR-optimized meta description templates
const CTR_META_TEMPLATES = [
  "Discover {benefit} in Albania. Learn {what_you_learn}. Start your career journey today! 👉",
  "Looking for {topic}? Get expert insights, real salary data, and actionable tips. Updated for {year}.",
  "{benefit}? Our complete guide covers everything from {point1} to {point2}. Read now!",
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get admin user for author_id
    const { data: adminUser } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (!adminUser) {
      throw new Error('No admin user found');
    }

    const authorId = adminUser.user_id;

    // Get all active blog authors for random selection
    const { data: blogAuthors } = await supabase
      .from('blog_authors')
      .select('id')
      .eq('is_active', true);
    
    const getRandomBlogAuthorId = () => {
      if (blogAuthors && blogAuthors.length > 0) {
        const randomIndex = Math.floor(Math.random() * blogAuthors.length);
        return blogAuthors[randomIndex].id;
      }
      return null;
    };

    // Get existing posts to avoid duplicates
    const { data: existingPosts } = await supabase
      .from('posts')
      .select('slug, title');

    const existingSlugs = new Set(existingPosts?.map(p => p.slug) || []);
    const existingTitles = new Set(existingPosts?.map(p => p.title.toLowerCase()) || []);

    // Determine what content to generate next
    const contentToGenerate = selectNextContent(existingSlugs, existingTitles);

    if (!contentToGenerate) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'All scheduled content has been generated' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Generating content:', contentToGenerate);

    // Generate the content based on type
    let result;
    switch (contentToGenerate.type) {
      case 'blog':
        result = await generateCTROptimizedBlog(LOVABLE_API_KEY, supabase, authorId, getRandomBlogAuthorId(), contentToGenerate.data);
        break;
      case 'cityGuide':
        result = await generateCityGuide(LOVABLE_API_KEY, supabase, authorId, getRandomBlogAuthorId(), contentToGenerate.data);
        break;
      case 'careerGuide':
        result = await generateCareerGuide(LOVABLE_API_KEY, supabase, authorId, getRandomBlogAuthorId(), contentToGenerate.data);
        break;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      contentType: contentToGenerate.type,
      result 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Scheduled content generator error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function selectNextContent(existingSlugs: Set<string>, existingTitles: Set<string>) {
  const year = new Date().getFullYear();
  
  // Priority 1: Long-tail blogs
  for (const blog of CONTENT_QUEUE.longTailBlogs) {
    const slug = blog.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!existingSlugs.has(slug) && !existingTitles.has(blog.topic.toLowerCase())) {
      return { type: 'blog', data: blog };
    }
  }

  // Priority 2: City guides
  for (const city of CONTENT_QUEUE.cityGuides) {
    const slug = `working-in-${city.city.toLowerCase()}-job-market-guide`;
    if (!existingSlugs.has(slug)) {
      return { type: 'cityGuide', data: city };
    }
  }

  // Priority 3: Career guides
  for (const career of CONTENT_QUEUE.careerGuides) {
    const slug = `${career.slug}-careers-albania-guide`;
    if (!existingSlugs.has(slug)) {
      return { type: 'careerGuide', data: career };
    }
  }

  return null;
}

async function generateCTROptimizedBlog(apiKey: string, supabase: any, authorId: string, blogAuthorId: string | null, blogData: any) {
  const year = new Date().getFullYear();
  
  const systemPrompt = `You are an expert SEO content writer specializing in the Albanian job market. 
Your task is to create blog posts that:
1. MAXIMIZE Click-Through Rate (CTR) from search results
2. Use power words in titles (Ultimate, Essential, Proven, Secret, Exclusive)
3. Include numbers in titles when appropriate (7 Steps, Top 10, etc.)
4. Create curiosity gaps that compel clicks
5. Write meta descriptions with clear CTAs and benefits (under 155 characters)
6. Structure content for featured snippets (use bullet points, numbered lists, tables)
7. Include FAQ sections with schema-friendly formatting
8. Use proper H1, H2, H3 hierarchy
9. Write in a professional yet engaging tone
10. Target the Albanian job market specifically

CRITICAL: Format the response as valid JSON only.`;

  const userPrompt = `Create a comprehensive, CTR-optimized blog post about: "${blogData.topic}"

Target keywords: ${blogData.keywords}

Return a JSON object with this EXACT structure:
{
  "title": "CTR-optimized title with power words (under 60 chars)",
  "metaTitle": "SEO title for search results (exactly 50-60 chars)",
  "metaDescription": "Compelling description with CTA (exactly 150-155 chars)",
  "excerpt": "2-sentence engaging summary",
  "content": "Full HTML content with proper headings, lists, tables, FAQ section",
  "tags": ["tag1", "tag2", "tag3"],
  "metaKeywords": ["keyword1", "keyword2", "keyword3"]
}

Content requirements:
- At least 1500 words
- Include H2 and H3 subheadings
- Add a practical tips section with bullet points
- Include a FAQ section (3-5 questions)
- Add a table if relevant (salary ranges, comparisons, etc.)
- End with a strong CTA mentioning Jobs.al
- Use Albanian-specific context and examples`;

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
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const aiResult = await response.json();
  const content = aiResult.choices[0]?.message?.content;
  
  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response format');
  
  const parsed = JSON.parse(jsonMatch[0]);
  const slug = blogData.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // Insert the post
  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      title: parsed.title,
      slug: slug,
      content: parsed.content,
      excerpt: parsed.excerpt,
      category: 'Career Advice',
      tags: parsed.tags,
      meta_title: parsed.metaTitle,
      meta_description: parsed.metaDescription,
      meta_keywords: parsed.metaKeywords,
      language: 'en',
      is_published: true,
      published_at: new Date().toISOString(),
      author_id: authorId,
      blog_author_id: blogAuthorId
    })
    .select()
    .single();

  if (error) throw error;
  
  console.log('Created blog post:', post.slug);
  return { slug: post.slug, title: post.title };
}

async function generateCityGuide(apiKey: string, supabase: any, authorId: string, blogAuthorId: string | null, cityData: any) {
  const year = new Date().getFullYear();
  
  const systemPrompt = `You are an expert content writer creating city-specific employment guides for Albania.
Create content that:
1. Maximizes CTR with compelling titles and descriptions
2. Provides real, actionable information about working in Albanian cities
3. Includes salary expectations, major employers, and industry breakdowns
4. Uses proper SEO structure with H2/H3 headings
5. Includes FAQ sections and comparison tables
6. Targets job seekers looking to work in specific Albanian cities

CRITICAL: Format the response as valid JSON only.`;

  const userPrompt = `Create a comprehensive guide about working in ${cityData.city}, ${cityData.region}.

Return a JSON object with this EXACT structure:
{
  "title": "Working in ${cityData.city}: Complete Job Market Guide ${year}",
  "metaTitle": "Jobs in ${cityData.city} Albania - Salary, Employers & Opportunities ${year}",
  "metaDescription": "Find your dream job in ${cityData.city}! Discover top employers, average salaries, and career opportunities. Updated guide for ${year} 👉",
  "excerpt": "Everything you need to know about working in ${cityData.city}",
  "content": "Full HTML content with city-specific job market info",
  "tags": ["${cityData.city.toLowerCase()} jobs", "albania employment", "work in ${cityData.city.toLowerCase()}"],
  "metaKeywords": ["jobs ${cityData.city.toLowerCase()}", "${cityData.city.toLowerCase()} employment", "work ${cityData.city.toLowerCase()} albania"]
}

Content must include:
- Overview of ${cityData.city}'s economy and job market
- Top industries and employers in the city
- Average salary ranges by sector (table format)
- Cost of living considerations
- Transportation and commute information
- Tips for job seekers in ${cityData.city}
- FAQ section (5 questions)
- At least 1500 words`;

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
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const aiResult = await response.json();
  const content = aiResult.choices[0]?.message?.content;
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response format');
  
  const parsed = JSON.parse(jsonMatch[0]);
  const slug = `working-in-${cityData.city.toLowerCase()}-job-market-guide`;

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      title: parsed.title,
      slug: slug,
      content: parsed.content,
      excerpt: parsed.excerpt,
      category: 'City Guide',
      tags: parsed.tags,
      meta_title: parsed.metaTitle,
      meta_description: parsed.metaDescription,
      meta_keywords: parsed.metaKeywords,
      language: 'en',
      is_published: true,
      published_at: new Date().toISOString(),
      author_id: authorId,
      blog_author_id: blogAuthorId
    })
    .select()
    .single();

  if (error) throw error;
  
  console.log('Created city guide:', post.slug);
  return { slug: post.slug, title: post.title };
}

async function generateCareerGuide(apiKey: string, supabase: any, authorId: string, blogAuthorId: string | null, careerData: any) {
  const year = new Date().getFullYear();
  
  const systemPrompt = `You are an expert career content writer specializing in the Albanian job market.
Create industry-specific career guides that:
1. Maximize CTR with compelling, benefit-focused titles
2. Provide comprehensive information about careers in specific industries
3. Include salary data, required skills, and career paths
4. Use proper SEO structure with tables and lists
5. Include FAQ sections and actionable tips
6. Target job seekers interested in specific industries in Albania

CRITICAL: Format the response as valid JSON only.`;

  const userPrompt = `Create a comprehensive career guide for ${careerData.industry} in Albania.

Return a JSON object with this EXACT structure:
{
  "title": "${careerData.industry} Careers in Albania: Complete Guide ${year}",
  "metaTitle": "${careerData.industry} Jobs Albania - Salaries, Skills & Career Path ${year}",
  "metaDescription": "Start your ${careerData.industry.toLowerCase()} career in Albania! Discover salaries, required skills, top employers, and growth opportunities. Expert guide 👉",
  "excerpt": "Your complete guide to ${careerData.industry.toLowerCase()} careers in Albania",
  "content": "Full HTML content with industry-specific career information",
  "tags": ["${careerData.slug} jobs albania", "${careerData.slug} careers", "albania ${careerData.slug}"],
  "metaKeywords": ["${careerData.slug} jobs albania", "${careerData.industry.toLowerCase()} careers", "${careerData.slug} salary albania"]
}

Content must include:
- Industry overview in Albania
- Popular job roles and descriptions (table format)
- Salary ranges by experience level (table format)
- Required skills and qualifications
- Top employers in Albania
- Career progression paths
- How to break into the industry
- Tips for job seekers
- FAQ section (5 questions)
- At least 1500 words`;

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
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const aiResult = await response.json();
  const content = aiResult.choices[0]?.message?.content;
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response format');
  
  const parsed = JSON.parse(jsonMatch[0]);
  const slug = `${careerData.slug}-careers-albania-guide`;

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      title: parsed.title,
      slug: slug,
      content: parsed.content,
      excerpt: parsed.excerpt,
      category: 'Career Guide',
      tags: parsed.tags,
      meta_title: parsed.metaTitle,
      meta_description: parsed.metaDescription,
      meta_keywords: parsed.metaKeywords,
      language: 'en',
      is_published: true,
      published_at: new Date().toISOString(),
      author_id: authorId,
      blog_author_id: blogAuthorId
    })
    .select()
    .single();

  if (error) throw error;
  
  console.log('Created career guide:', post.slug);
  return { slug: post.slug, title: post.title };
}
