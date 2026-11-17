import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { requireAdmin } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authorizationCheck = await requireAdmin(req);
    if (!authorizationCheck.ok) return authorizationCheck.response;
    const { sourceUrl, companyId } = await req.json();
    let parsedSource: URL;
    try { parsedSource = new URL(String(sourceUrl)); } catch { return new Response(JSON.stringify({ error: 'Invalid URL' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
    const allowedHosts = ['duapune.com', 'www.duapune.com', 'karriere.al', 'www.karriere.al'];
    if (parsedSource.protocol !== 'https:' || !allowedHosts.includes(parsedSource.hostname)) {
      return new Response(JSON.stringify({ error: 'Source not allowed' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching job content from:', sourceUrl);

    // ⚠️ WARNING: Web scraping may violate Terms of Service
    // This is for educational purposes only. Always get permission first.
    const pageResponse = await fetch(parsedSource.toString(), { redirect: 'error',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobsAlBot/1.0; +https://jobs.al/bot)'
      }
    });

    if (!pageResponse.ok) {
      throw new Error('Failed to fetch source page');
    }

    const htmlContent = await pageResponse.text();

    console.log('Processing job content with AI...');

    // Use AI to extract and rewrite job information
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a job posting analyzer. Extract job information from HTML and rewrite it professionally for Jobs.al.
            
            IMPORTANT: 
            - Extract all relevant job details
            - Rewrite the content to be original while maintaining accuracy
            - Make it engaging and professional
            - Focus on Albanian job market context`
          },
          {
            role: 'user',
            content: `Analyze this job posting HTML and extract the information. Then rewrite it professionally:

${htmlContent.substring(0, 15000)}

Return a JSON object with these exact fields:
{
  "title": "Job title",
  "description": "Full job description (rewritten, 200-500 words)",
  "location": "City, Albania",
  "job_type": "full_time|part_time|contract|internship|freelance",
  "experience_level": "entry|mid|senior|executive",
  "category": "Technology|Marketing|Design|Sales|etc",
  "salary_min": number or null,
  "salary_max": number or null,
  "salary_currency": "ALL|EUR|USD",
  "requirements": "Rewritten requirements section",
  "responsibilities": "Rewritten responsibilities section",
  "skills": ["skill1", "skill2", "skill3"],
  "benefits": ["benefit1", "benefit2"],
  "is_remote": boolean,
  "seo_title": "SEO optimized title",
  "seo_description": "Meta description for SEO"
}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI processing error:', errorText);
      throw new Error('Failed to process job with AI');
    }

    const aiData = await aiResponse.json();
    const jobData = JSON.parse(aiData.choices[0].message.content);

    // Verify companyId exists
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, owner_id')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      throw new Error('Invalid company ID');
    }

    // Create slug from title
    const slug = jobData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now();

    // Insert job into database
    const { data: newJob, error: jobError } = await supabase
      .from('jobs')
      .insert({
        company_id: companyId,
        posted_by: company.owner_id,
        title: jobData.title,
        slug: slug,
        description: jobData.description,
        location: jobData.location,
        job_type: jobData.job_type,
        experience_level: jobData.experience_level,
        category: jobData.category,
        salary_min: jobData.salary_min,
        salary_max: jobData.salary_max,
        salary_currency: jobData.salary_currency || 'ALL',
        requirements: jobData.requirements,
        responsibilities: jobData.responsibilities,
        skills: jobData.skills,
        benefits: jobData.benefits,
        is_remote: jobData.is_remote,
        seo_title: jobData.seo_title,
        seo_description: jobData.seo_description,
        is_active: false, // Set to false for review
        is_featured: false
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job:', jobError);
      throw jobError;
    }

    console.log('Job created successfully:', newJob.id);

    return new Response(
      JSON.stringify({
        success: true,
        job: newJob,
        message: 'Job scraped and created successfully (pending review)'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-jobs function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});