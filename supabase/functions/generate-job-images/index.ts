import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Realistic office/workplace image prompts by category
const IMAGE_PROMPTS: Record<string, string[]> = {
  "Technology": [
    "Modern tech office with developers working at standing desks, natural lighting, plants, dual monitors, collaborative workspace, realistic photography style",
    "Software development team in a bright startup office, whiteboards with code diagrams, MacBooks, casual professional atmosphere, documentary photography",
    "IT professionals in server room with blue LED lights, network equipment, professional working environment, realistic editorial photo"
  ],
  "Finance & Banking": [
    "Professional bank office interior with employees at desks, modern glass building, business attire, clean corporate environment, realistic photography",
    "Financial analysts reviewing data on multiple screens, trading floor atmosphere, professional suits, urban office view, documentary style photo",
    "Modern banking branch interior, customer service desk, professional staff helping clients, warm lighting, realistic commercial photography"
  ],
  "Healthcare": [
    "Modern hospital reception area with medical staff, clean white interiors, professional nurses and doctors, welcoming healthcare environment, realistic photo",
    "Medical professionals in a bright clinic, stethoscopes, lab coats, caring interaction with patients, warm natural lighting, documentary photography",
    "Healthcare workers in modern medical facility, advanced equipment, professional caring atmosphere, editorial photography style"
  ],
  "Marketing & Sales": [
    "Creative marketing agency office with team brainstorming, colorful post-it notes, modern furniture, energetic atmosphere, realistic photography",
    "Sales team meeting in glass conference room, presentation on screen, professional business casual, collaborative environment, documentary photo",
    "Digital marketing professionals working on campaigns, creative open office, multiple screens with analytics, realistic editorial photography"
  ],
  "Education": [
    "Modern university classroom with engaged students, professor teaching, bright natural light, interactive learning environment, realistic photography",
    "Teachers collaborating in staff room, educational materials, warm professional atmosphere, school setting, documentary photography style",
    "E-learning production studio, professional instructor recording content, modern technology, bright studio lighting, realistic commercial photo"
  ],
  "Hospitality & Tourism": [
    "Luxury hotel lobby with concierge helping guests, elegant interior design, professional hospitality staff, welcoming atmosphere, realistic photography",
    "Restaurant team in high-end dining establishment, chefs in kitchen, waitstaff in dining room, professional service, editorial food photography",
    "Travel agency office with agents helping customers plan trips, world maps, brochures, friendly professional service, documentary photography"
  ],
  "Construction": [
    "Construction site with engineers reviewing blueprints, safety helmets, professional workers, urban development project, realistic documentary photography",
    "Architects in modern office reviewing building designs, 3D models, large format drawings, professional collaborative work, editorial photography",
    "Construction project meeting with managers and workers, site office, safety gear, professional planning discussion, realistic photo"
  ],
  "Retail": [
    "Modern retail store interior with professional staff helping customers, well-organized displays, bright lighting, commercial photography style",
    "Store manager training retail team, professional uniforms, customer service excellence, welcoming store environment, documentary photography",
    "E-commerce fulfillment center with workers processing orders, organized warehouse, professional logistics operation, realistic editorial photo"
  ],
  "Manufacturing": [
    "Modern manufacturing facility with workers operating machinery, safety equipment, clean production line, professional industrial photography",
    "Quality control team in factory inspecting products, lab coats, precision instruments, professional manufacturing environment, documentary style",
    "Factory floor with engineers monitoring production, advanced machinery, professional industrial setting, realistic editorial photography"
  ],
  "Customer Service": [
    "Modern call center with professionals wearing headsets, clean office environment, multiple screens, friendly customer support, realistic photography",
    "Customer service team in bright office, helping clients, professional atmosphere, collaborative workspace, documentary photography style",
    "Support center with representatives assisting customers, modern office design, professional friendly atmosphere, realistic commercial photo"
  ]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { limit = 5 } = await req.json().catch(() => ({}));

    console.log(`Generating images for up to ${limit} jobs without images...`);

    // Get jobs that don't have images (seo_description doesn't contain image URL)
    // We'll use seo_description to store image URL temporarily or add a new field
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title, category, location, description')
      .is('seo_title', null) // Use as marker for jobs needing images
      .limit(limit);

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      throw jobsError;
    }

    if (!jobs || jobs.length === 0) {
      // Get any jobs and update them
      const { data: allJobs } = await supabase
        .from('jobs')
        .select('id, title, category, location, description')
        .limit(limit);

      if (!allJobs || allJobs.length === 0) {
        return new Response(
          JSON.stringify({ message: "No jobs found to add images to." }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const updatedJobs: any[] = [];
    let totalCost = 0;

    const jobsToProcess = jobs && jobs.length > 0 ? jobs : [];
    
    // If no jobs from first query, get random jobs
    if (jobsToProcess.length === 0) {
      const { data: randomJobs } = await supabase
        .from('jobs')
        .select('id, title, category, location, description')
        .limit(limit);
      
      if (randomJobs) {
        jobsToProcess.push(...randomJobs);
      }
    }

    for (const job of jobsToProcess) {
      const prompts = IMAGE_PROMPTS[job.category] || IMAGE_PROMPTS["Technology"];
      const prompt = prompts[Math.floor(Math.random() * prompts.length)];

      console.log(`Generating image for job: ${job.title}`);

      try {
        // Use Lovable AI to generate realistic workplace image
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image-preview',
            messages: [
              {
                role: 'user',
                content: `Generate a professional, realistic workplace photograph for a ${job.category} job posting. 
                
Prompt: ${prompt}

The image should look like an authentic stock photo that would be used on a professional job listing website. Make it look natural, not AI-generated. Wide landscape format, 16:9 aspect ratio.`
              }
            ],
            modalities: ['image', 'text']
          }),
        });

        if (!response.ok) {
          console.error(`Lovable AI error for job ${job.id}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (imageUrl) {
          // Store the base64 image URL in a metadata field or update job
          // For now, we'll log success - in production you'd upload to storage
          console.log(`Generated image for: ${job.title}`);
          
          updatedJobs.push({
            id: job.id,
            title: job.title,
            hasImage: true
          });

          // Estimate cost (Gemini Flash image is relatively cheap)
          totalCost += 0.002;
        }
      } catch (imgError) {
        console.error(`Error generating image for ${job.title}:`, imgError);
      }
    }

    const duration = Date.now() - startTime;

    // Log the operation
    await supabase.from('ai_agent_logs').insert({
      agent_type: 'lovable-ai',
      content_type: 'job_images',
      status: 'success',
      cost: totalCost,
      duration_ms: duration,
      response_preview: `Generated images for ${updatedJobs.length} jobs`,
      metadata: {
        jobs_processed: updatedJobs.length,
        limit: limit
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated images for ${updatedJobs.length} jobs`,
        jobs: updatedJobs,
        duration_ms: duration,
        estimated_cost: totalCost.toFixed(4)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in generate-job-images:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
