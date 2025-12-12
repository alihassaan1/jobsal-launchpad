import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Job categories and sample data for Albanian job market
const JOB_CATEGORIES = [
  "Technology",
  "Finance & Banking",
  "Healthcare",
  "Marketing & Sales",
  "Education",
  "Hospitality & Tourism",
  "Construction",
  "Retail",
  "Manufacturing",
  "Customer Service"
];

const LOCATIONS = ["Tirana", "Durrës", "Vlorë", "Shkodër", "Elbasan", "Fier", "Korçë", "Berat"];

const JOB_TYPES = ["full_time", "part_time", "contract", "internship"];
const EXPERIENCE_LEVELS = ["entry", "mid", "senior", "executive"];

const SKILLS_BY_CATEGORY: Record<string, string[]> = {
  "Technology": ["JavaScript", "Python", "React", "Node.js", "SQL", "AWS", "TypeScript", "Docker", "Git"],
  "Finance & Banking": ["Financial Analysis", "Excel", "Accounting", "Risk Management", "Banking Operations", "Auditing"],
  "Healthcare": ["Patient Care", "Medical Records", "Clinical Skills", "Healthcare Management", "First Aid"],
  "Marketing & Sales": ["Digital Marketing", "SEO", "Social Media", "Sales", "CRM", "Lead Generation", "Content Writing"],
  "Education": ["Teaching", "Curriculum Development", "Student Assessment", "Classroom Management", "E-learning"],
  "Hospitality & Tourism": ["Customer Service", "Hotel Management", "Event Planning", "Multilingual", "Hospitality"],
  "Construction": ["Project Management", "AutoCAD", "Safety Regulations", "Civil Engineering", "Site Management"],
  "Retail": ["Sales", "Inventory Management", "Customer Service", "POS Systems", "Visual Merchandising"],
  "Manufacturing": ["Quality Control", "Production Planning", "Lean Manufacturing", "Machine Operation", "Safety"],
  "Customer Service": ["Communication", "Problem Solving", "CRM Software", "Multilingual", "Conflict Resolution"]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { jobsPerCategory = 3 } = await req.json().catch(() => ({}));
    
    console.log(`Seeding ${jobsPerCategory} jobs per category using DeepSeek API...`);
    
    // First, check if we have a company to post jobs under
    let { data: companies } = await supabase
      .from('companies')
      .select('id, owner_id, name')
      .limit(1);
    
    // If no companies exist, create sample companies
    if (!companies || companies.length === 0) {
      console.log('No companies found. Creating sample companies...');
      
      const sampleCompanies = [
        {
          name: 'TechCorp Albania',
          slug: 'techcorp-albania',
          description: 'Leading technology company in Albania providing innovative software solutions and digital transformation services.',
          industry: 'Technology',
          location: 'Tirana',
          company_size: '51-200 employees',
          website: 'https://techcorp.al',
          is_verified: true,
          logo_url: 'https://ui-avatars.com/api/?name=TechCorp&background=0066cc&color=fff&size=200'
        },
        {
          name: 'Raiffeisen Bank Albania',
          slug: 'raiffeisen-bank-albania',
          description: 'One of the largest banking institutions in Albania offering comprehensive financial services.',
          industry: 'Finance & Banking',
          location: 'Tirana',
          company_size: '501-1000 employees',
          website: 'https://raiffeisen.al',
          is_verified: true,
          logo_url: 'https://ui-avatars.com/api/?name=Raiffeisen&background=FFD700&color=000&size=200'
        },
        {
          name: 'Albania Tourism Group',
          slug: 'albania-tourism-group',
          description: 'Premier hospitality and tourism company showcasing the beauty of Albania to the world.',
          industry: 'Tourism & Hospitality',
          location: 'Vlorë',
          company_size: '201-500 employees',
          website: 'https://albaniatourism.al',
          is_verified: true,
          logo_url: 'https://ui-avatars.com/api/?name=ATG&background=00AA55&color=fff&size=200'
        },
        {
          name: 'MediCare Albania',
          slug: 'medicare-albania',
          description: 'Leading healthcare provider with modern facilities and world-class medical professionals.',
          industry: 'Healthcare',
          location: 'Tirana',
          company_size: '201-500 employees',
          website: 'https://medicare.al',
          is_verified: true,
          logo_url: 'https://ui-avatars.com/api/?name=MediCare&background=DC3545&color=fff&size=200'
        },
        {
          name: 'EduTech Albania',
          slug: 'edutech-albania',
          description: 'Innovative education technology company transforming learning experiences in Albania.',
          industry: 'Education',
          location: 'Durrës',
          company_size: '11-50 employees',
          website: 'https://edutech.al',
          is_verified: true,
          logo_url: 'https://ui-avatars.com/api/?name=EduTech&background=6F42C1&color=fff&size=200'
        }
      ];

      // Get or create a system user for ownership
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (!profiles || profiles.length === 0) {
        return new Response(
          JSON.stringify({ error: "No users found. Please create a user account first." }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const ownerId = profiles[0].id;

      for (const companyData of sampleCompanies) {
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({ ...companyData, owner_id: ownerId })
          .select()
          .single();

        if (companyError) {
          console.error('Error creating company:', companyError);
        } else {
          console.log(`Created company: ${newCompany.name}`);
          if (!companies) companies = [];
          companies.push(newCompany);
        }
      }
    }

    if (!companies || companies.length === 0) {
      return new Response(
        JSON.stringify({ error: "Could not create companies." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use random company for each job
    const getRandomCompany = () => companies[Math.floor(Math.random() * companies.length)];
    const createdJobs: any[] = [];
    let totalTokens = 0;
    let totalCost = 0;

    for (const category of JOB_CATEGORIES) {
      console.log(`Generating jobs for category: ${category}`);
      
      for (let i = 0; i < jobsPerCategory; i++) {
        const randomCompany = getRandomCompany();
        const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
        const jobType = JOB_TYPES[Math.floor(Math.random() * JOB_TYPES.length)];
        const experienceLevel = EXPERIENCE_LEVELS[Math.floor(Math.random() * EXPERIENCE_LEVELS.length)];
        const skills = SKILLS_BY_CATEGORY[category]?.slice(0, 4 + Math.floor(Math.random() * 3)) || [];
        
        // Generate job content using DeepSeek
        const prompt = `Generate a realistic job posting for the Albanian job market with these details:
- Category: ${category}
- Location: ${location}, Albania
- Job Type: ${jobType.replace('_', ' ')}
- Experience Level: ${experienceLevel}
- Skills needed: ${skills.join(', ')}

Write in a natural, professional style that sounds human-written. Avoid generic AI patterns.
Include varied sentence structures, occasional rhetorical questions, and specific local context.

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "title": "Job title in English",
  "description": "2-3 paragraph job description with company culture and role overview",
  "requirements": "4-6 bullet points of key requirements",
  "responsibilities": "5-7 bullet points of main responsibilities",
  "benefits": ["benefit1", "benefit2", "benefit3", "benefit4"],
  "salary_min": number (monthly in EUR, realistic for Albania),
  "salary_max": number (monthly in EUR, realistic for Albania)
}`;

        try {
          const aiResponse = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${deepseekApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages: [
                {
                  role: 'system',
                  content: `You are a professional HR content writer for Albanian companies. Write naturally with varied sentence lengths, use occasional rhetorical questions, and include specific local context. Avoid repetitive AI patterns like "In this role..." or "We are looking for...". Be creative with your openings and structure.`
                },
                { role: 'user', content: prompt }
              ],
              temperature: 0.8,
              max_tokens: 1000,
            }),
          });

          if (!aiResponse.ok) {
            console.error(`DeepSeek API error: ${aiResponse.status}`);
            continue;
          }

          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content;
          
          // Track tokens
          const promptTokens = aiData.usage?.prompt_tokens || 0;
          const completionTokens = aiData.usage?.completion_tokens || 0;
          totalTokens += promptTokens + completionTokens;
          
          // DeepSeek pricing: ~$0.07/1M input, ~$0.14/1M output
          const cost = (promptTokens * 0.00007 / 1000) + (completionTokens * 0.00014 / 1000);
          totalCost += cost;

          // Parse the JSON response
          let jobData;
          try {
            // Clean the response - remove markdown code blocks if present
            let cleanContent = content.trim();
            if (cleanContent.startsWith('```json')) {
              cleanContent = cleanContent.slice(7);
            }
            if (cleanContent.startsWith('```')) {
              cleanContent = cleanContent.slice(3);
            }
            if (cleanContent.endsWith('```')) {
              cleanContent = cleanContent.slice(0, -3);
            }
            jobData = JSON.parse(cleanContent.trim());
          } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            continue;
          }

          // Generate a unique slug
          const slug = `${jobData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${location.toLowerCase()}-${Date.now().toString(36)}`;

          // Insert the job
          const { data: job, error: insertError } = await supabase
            .from('jobs')
            .insert({
              title: jobData.title,
              slug: slug,
              description: jobData.description,
              requirements: jobData.requirements,
              responsibilities: jobData.responsibilities,
              benefits: jobData.benefits,
              category: category,
              location: location,
              job_type: jobType as any,
              experience_level: experienceLevel as any,
              skills: skills,
              salary_min: jobData.salary_min,
              salary_max: jobData.salary_max,
              salary_currency: 'EUR',
              is_salary_visible: true,
              is_active: true,
              is_featured: Math.random() > 0.7, // 30% featured
              company_id: randomCompany.id,
              posted_by: randomCompany.owner_id,
              seo_title: `${jobData.title} in ${location} | Jobs.al`,
              seo_description: `Apply for ${jobData.title} position at ${randomCompany.name} in ${location}. ${experienceLevel} level ${jobType.replace('_', ' ')} opportunity.`
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error inserting job:', insertError);
            continue;
          }

          createdJobs.push(job);
          console.log(`Created job: ${jobData.title} in ${location}`);
          
        } catch (aiError) {
          console.error(`Error generating job for ${category}:`, aiError);
          continue;
        }
      }
    }

    const duration = Date.now() - startTime;

    // Log the API usage
    await supabase.from('ai_agent_logs').insert({
      agent_type: 'deepseek',
      content_type: 'seed_jobs',
      status: 'success',
      total_tokens: totalTokens,
      cost: totalCost,
      duration_ms: duration,
      response_preview: `Created ${createdJobs.length} jobs across ${JOB_CATEGORIES.length} categories`,
      metadata: {
        jobs_created: createdJobs.length,
        categories_processed: JOB_CATEGORIES.length,
        jobs_per_category: jobsPerCategory
      }
    });

    console.log(`Successfully created ${createdJobs.length} jobs in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${createdJobs.length} jobs across ${JOB_CATEGORIES.length} categories`,
        jobs_created: createdJobs.length,
        total_tokens: totalTokens,
        total_cost: totalCost.toFixed(4),
        duration_ms: duration
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in seed-jobs function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
