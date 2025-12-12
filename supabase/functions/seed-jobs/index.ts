import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 25+ Job categories matching DuaPune.com
const JOB_CATEGORIES = [
  "Technology",
  "Marketing",
  "Design",
  "Sales",
  "Finance",
  "Healthcare",
  "Education",
  "Engineering",
  "Hospitality & Tourism",
  "Construction",
  "Administration",
  "Banking & Insurance",
  "Call Center",
  "Management",
  "Media & Journalism",
  "HOREKA",
  "Real Estate",
  "IT & Telecom",
  "Legal",
  "Accounting",
  "Logistics & Transport",
  "Production & Industry",
  "Human Resources",
  "Customer Service",
  "Retail"
];

// 30+ Albanian cities
const LOCATIONS = [
  "Tirana",
  "Durrës",
  "Vlorë",
  "Shkodër",
  "Elbasan",
  "Fier",
  "Korçë",
  "Berat",
  "Lushnjë",
  "Pogradec",
  "Kavajë",
  "Laç",
  "Gjirokastër",
  "Sarandë",
  "Lezhë",
  "Peshkopi",
  "Kuçovë",
  "Krujë",
  "Kukës",
  "Patos",
  "Roskovec",
  "Burrel",
  "Bulqizë",
  "Gramsh",
  "Tepelenë",
  "Përmet",
  "Ersekë",
  "Bilisht",
  "Himarë",
  "Remote"
];

const JOB_TYPES = ["full_time", "part_time", "contract", "internship", "freelance"];
const EXPERIENCE_LEVELS = ["entry", "mid", "senior", "executive"];

const SKILLS_BY_CATEGORY: Record<string, string[]> = {
  "Technology": ["JavaScript", "Python", "React", "Node.js", "SQL", "AWS", "TypeScript", "Docker", "Git", "MongoDB"],
  "Marketing": ["Digital Marketing", "SEO", "Social Media", "Content Marketing", "Google Ads", "Facebook Ads", "Analytics", "Email Marketing"],
  "Design": ["Figma", "Adobe Photoshop", "Adobe Illustrator", "UI/UX", "Typography", "Branding", "Web Design", "Canva"],
  "Sales": ["CRM", "Negotiation", "B2B Sales", "Lead Generation", "Salesforce", "Communication", "Presentation", "Account Management"],
  "Finance": ["Financial Analysis", "Excel", "Accounting", "Risk Management", "Banking", "Auditing", "SAP", "QuickBooks"],
  "Healthcare": ["Patient Care", "Medical Records", "Clinical Skills", "Healthcare Management", "First Aid", "EMR Systems", "HIPAA"],
  "Education": ["Teaching", "Curriculum Development", "E-learning", "Student Assessment", "Classroom Management", "LMS"],
  "Engineering": ["AutoCAD", "Project Management", "Civil Engineering", "Mechanical Design", "Electrical Systems", "SolidWorks"],
  "Hospitality & Tourism": ["Customer Service", "Hotel Management", "Event Planning", "Multilingual", "Hospitality", "Reservation Systems"],
  "Construction": ["Project Management", "Safety Regulations", "Site Management", "Quantity Surveying", "Blueprint Reading", "AutoCAD"],
  "Administration": ["MS Office", "Organization", "Communication", "Time Management", "Data Entry", "Calendar Management"],
  "Banking & Insurance": ["Banking Operations", "Customer Service", "Sales", "Compliance", "Risk Assessment", "KYC"],
  "Call Center": ["Communication", "Languages", "Problem Solving", "CRM Software", "Patience", "Typing Speed"],
  "Management": ["Leadership", "Strategic Planning", "Team Management", "Decision Making", "Budgeting", "KPI Tracking"],
  "Media & Journalism": ["Writing", "Editing", "Social Media", "Video Production", "Photography", "Content Creation"],
  "HOREKA": ["Hospitality", "Customer Service", "Food & Beverage", "Languages", "Event Management", "POS Systems"],
  "Real Estate": ["Sales", "Negotiation", "Market Knowledge", "Customer Relations", "Property Valuation", "Contract Management"],
  "IT & Telecom": ["Networking", "System Administration", "Cloud Computing", "Cybersecurity", "Linux", "Windows Server"],
  "Legal": ["Legal Research", "Contract Law", "Compliance", "Documentation", "Legal Writing", "Corporate Law"],
  "Accounting": ["Accounting", "Excel", "ERP Systems", "Tax Knowledge", "Payroll", "Financial Reporting", "GAAP"],
  "Logistics & Transport": ["Supply Chain", "Warehouse Management", "ERP", "Planning", "Inventory Control", "Fleet Management"],
  "Production & Industry": ["Quality Control", "Machine Operation", "Safety", "Lean Manufacturing", "Production Planning", "5S"],
  "Human Resources": ["Recruitment", "Training", "Employee Relations", "HRIS", "Payroll", "Performance Management"],
  "Customer Service": ["Communication", "Problem Solving", "CRM Software", "Multilingual", "Conflict Resolution", "Active Listening"],
  "Retail": ["Sales", "Inventory Management", "Customer Service", "POS Systems", "Visual Merchandising", "Cash Handling"]
};

// Sample Albanian company names
const SAMPLE_COMPANIES = [
  { name: "TechCorp Albania", industry: "Technology", location: "Tirana" },
  { name: "Raiffeisen Bank Albania", industry: "Banking & Insurance", location: "Tirana" },
  { name: "Albania Tourism Group", industry: "Hospitality & Tourism", location: "Vlorë" },
  { name: "MediCare Albania", industry: "Healthcare", location: "Tirana" },
  { name: "EduTech Albania", industry: "Education", location: "Durrës" },
  { name: "BuildRight Construction", industry: "Construction", location: "Tirana" },
  { name: "DigitalAds Agency", industry: "Marketing", location: "Tirana" },
  { name: "AlbaLogistics", industry: "Logistics & Transport", location: "Durrës" },
  { name: "FoodMaster HOREKA", industry: "HOREKA", location: "Sarandë" },
  { name: "LegalFirst Albania", industry: "Legal", location: "Tirana" },
  { name: "RetailMax", industry: "Retail", location: "Tirana" },
  { name: "HRPro Solutions", industry: "Human Resources", location: "Tirana" },
  { name: "CallCenter Pro", industry: "Call Center", location: "Tirana" },
  { name: "AlbaMedia Group", industry: "Media & Journalism", location: "Tirana" },
  { name: "PropertyFirst Real Estate", industry: "Real Estate", location: "Tirana" },
  { name: "TelecomAlbania", industry: "IT & Telecom", location: "Tirana" },
  { name: "FinanceHub", industry: "Finance", location: "Tirana" },
  { name: "DesignStudio Tirana", industry: "Design", location: "Tirana" },
  { name: "SalesForce Albania", industry: "Sales", location: "Durrës" },
  { name: "IndustrialWorks", industry: "Production & Industry", location: "Elbasan" },
  { name: "AdminPro Services", industry: "Administration", location: "Shkodër" },
  { name: "AccountingPlus", industry: "Accounting", location: "Korçë" },
  { name: "CustomerCare Albania", industry: "Customer Service", location: "Fier" },
  { name: "EngineeringSolutions", industry: "Engineering", location: "Berat" },
  { name: "ManagementExperts", industry: "Management", location: "Tirana" }
];

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
    
    const { jobsPerCategory = 5 } = await req.json().catch(() => ({}));
    
    console.log(`Seeding ${jobsPerCategory} jobs per category (${JOB_CATEGORIES.length} categories) using DeepSeek API...`);
    
    // First, check if we have companies
    let { data: companies } = await supabase
      .from('companies')
      .select('id, owner_id, name, industry')
      .limit(50);
    
    // If no companies exist, create sample companies
    if (!companies || companies.length === 0) {
      console.log('No companies found. Creating sample companies...');
      
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
      companies = [];

      for (const companyData of SAMPLE_COMPANIES) {
        const slug = companyData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: companyData.name,
            slug: slug,
            description: `${companyData.name} - Leading ${companyData.industry} company in Albania providing professional services.`,
            industry: companyData.industry,
            location: companyData.location,
            company_size: '11-50 employees',
            is_verified: true,
            owner_id: ownerId,
            logo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(companyData.name)}&background=random&color=fff&size=200`
          })
          .select()
          .single();

        if (companyError) {
          console.error('Error creating company:', companyError);
        } else {
          console.log(`Created company: ${newCompany.name}`);
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

    // Get company by industry for relevant job assignments
    const getCompanyForCategory = (category: string) => {
      const matching = companies.filter(c => c.industry?.toLowerCase().includes(category.toLowerCase().split(' ')[0]));
      if (matching.length > 0) return matching[Math.floor(Math.random() * matching.length)];
      return companies[Math.floor(Math.random() * companies.length)];
    };

    const createdJobs: any[] = [];
    let totalTokens = 0;
    let totalCost = 0;

    for (const category of JOB_CATEGORIES) {
      console.log(`Generating jobs for category: ${category}`);
      
      for (let i = 0; i < jobsPerCategory; i++) {
        const randomCompany = getCompanyForCategory(category);
        const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
        const jobType = JOB_TYPES[Math.floor(Math.random() * JOB_TYPES.length)];
        const experienceLevel = EXPERIENCE_LEVELS[Math.floor(Math.random() * EXPERIENCE_LEVELS.length)];
        const skills = SKILLS_BY_CATEGORY[category]?.slice(0, 4 + Math.floor(Math.random() * 3)) || [];
        
        // Generate bilingual job content using DeepSeek
        const prompt = `Generate a realistic BILINGUAL job posting for the Albanian job market with these details:
- Category: ${category}
- Location: ${location}, Albania
- Job Type: ${jobType.replace('_', ' ')}
- Experience Level: ${experienceLevel}
- Skills needed: ${skills.join(', ')}
- Company: ${randomCompany.name}

Write the job title and content in Albanian (primary) but include key terms in English for SEO.
Write naturally with varied sentence structures. Avoid generic AI patterns.
Include salary in EUR (realistic for Albania: €300-400 for entry, €500-800 for mid, €800-1500 for senior, €1500+ for executive).

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "title": "Job title in Albanian (with English equivalent in parentheses if helpful)",
  "title_en": "Job title in English",
  "description": "2-3 paragraph job description in Albanian, mentioning company culture and role overview",
  "requirements": "4-6 bullet points of key requirements in Albanian",
  "responsibilities": "5-7 bullet points of main responsibilities in Albanian",
  "benefits": ["benefit1", "benefit2", "benefit3", "benefit4"],
  "salary_min": number (monthly in EUR),
  "salary_max": number (monthly in EUR)
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
                  content: `You are a professional HR content writer for Albanian companies. Write job postings primarily in Albanian but include relevant English terms for SEO. Be natural and avoid repetitive AI patterns.`
                },
                { role: 'user', content: prompt }
              ],
              temperature: 0.8,
              max_tokens: 1200,
            }),
          });

          if (!aiResponse.ok) {
            console.error(`DeepSeek API error: ${aiResponse.status}`);
            continue;
          }

          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content;
          
          const promptTokens = aiData.usage?.prompt_tokens || 0;
          const completionTokens = aiData.usage?.completion_tokens || 0;
          totalTokens += promptTokens + completionTokens;
          const cost = (promptTokens * 0.00007 / 1000) + (completionTokens * 0.00014 / 1000);
          totalCost += cost;

          let jobData;
          try {
            let cleanContent = content.trim();
            if (cleanContent.startsWith('```json')) cleanContent = cleanContent.slice(7);
            if (cleanContent.startsWith('```')) cleanContent = cleanContent.slice(3);
            if (cleanContent.endsWith('```')) cleanContent = cleanContent.slice(0, -3);
            jobData = JSON.parse(cleanContent.trim());
          } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            continue;
          }

          const slug = `${(jobData.title_en || jobData.title).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${location.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;

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
              is_featured: Math.random() > 0.7,
              company_id: randomCompany.id,
              posted_by: randomCompany.owner_id,
              seo_title: `${jobData.title_en || jobData.title} në ${location} | Jobs.al`,
              seo_description: `Apliko për ${jobData.title} pranë ${randomCompany.name} në ${location}. ${experienceLevel} level ${jobType.replace('_', ' ')} mundësi punësimi.`
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

    await supabase.from('ai_agent_logs').insert({
      agent_type: 'deepseek',
      content_type: 'seed_jobs',
      status: 'success',
      total_tokens: totalTokens,
      cost: totalCost,
      duration_ms: duration,
      response_preview: `Created ${createdJobs.length} jobs across ${JOB_CATEGORIES.length} categories (${LOCATIONS.length} cities)`,
      metadata: {
        jobs_created: createdJobs.length,
        categories_count: JOB_CATEGORIES.length,
        locations_count: LOCATIONS.length,
        jobs_per_category: jobsPerCategory
      }
    });

    console.log(`Successfully created ${createdJobs.length} jobs in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${createdJobs.length} jobs across ${JOB_CATEGORIES.length} categories and ${LOCATIONS.length} cities`,
        jobs_created: createdJobs.length,
        categories: JOB_CATEGORIES.length,
        cities: LOCATIONS.length,
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
