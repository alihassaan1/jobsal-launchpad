import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { taskType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an AI Marketing Agent for Jobs.al, Albania's premier job portal.
Your role is to automatically find, qualify, draft outreach, and generate leads.

CRITICAL: For every lead you generate, you MUST provide ALL required fields in valid JSON format.

Lead Types:
1. Employers - Albanian companies + remote-friendly EU companies hiring Albanian talent
2. Universities - Albanian universities and Balkan institutions with career centers

Required Fields for EVERY Lead:
- lead_type: "employer" OR "university"
- company_name: (for employers, leave empty for universities)
- university_name: (for universities, leave empty for employers)
- industry: specific industry/sector
- contact_name: person's name or null if unknown
- contact_email: email address or null if unavailable
- linkedin_url: company/person LinkedIn URL or null
- relevance_notes: one sentence explaining why this lead matters to Jobs.al
- draft_email: full personalized outreach message with CTA and signup link
- draft_linkedin: under 300 chars, no links, friendly request
- priority: "high" (active hiring, direct contact) / "medium" (occasional hiring) / "low" (hard to contact)
- utm_campaign: unique slug format "employer_companyname_location_date" or "university_name_date"
- created_by_agent_run_id: use current timestamp as run ID

Draft Email Requirements:
- Personalized based on relevance
- Include: https://jobs.al/signup?utm_source=outreach&utm_campaign={CAMPAIGN_SLUG}
- Professional, friendly, short
- Clear CTA to create free account

Validation:
- Use REAL companies and universities
- No duplicates (same company + type + email)
- Fill all fields (use null for unknown contact info)
- Generate 10-15 high-quality leads per run

IMPORTANT: Return ONLY valid JSON array of lead objects, no markdown formatting.`;

    let userPrompt = '';
    const agentRunId = `run_${Date.now()}`;
    
    if (taskType === 'daily') {
      userPrompt = `Generate 10-15 marketing leads for Jobs.al today.

Return a JSON array where each object has this EXACT structure:

{
  "lead_type": "employer" or "university",
  "company_name": "Company Name" or null,
  "university_name": "University Name" or null,
  "industry": "Industry/Sector",
  "contact_name": "Contact Person" or null,
  "contact_email": "email@example.com" or null,
  "linkedin_url": "https://linkedin.com/company/..." or null,
  "relevance_notes": "One sentence why this lead matters",
  "draft_email": "Full personalized email with signup link",
  "draft_linkedin": "Short LinkedIn message under 300 chars",
  "priority": "high" or "medium" or "low",
  "utm_campaign": "unique_campaign_slug",
  "created_by_agent_run_id": "${agentRunId}"
}

Mix of:
- 7-10 Albanian employers (tech companies, retailers, banks, hospitality, etc.)
- 3-5 Albanian/Balkan universities

Make leads realistic, diverse, and high-quality. Return ONLY the JSON array.`;
    } else if (taskType === 'weekly') {
      userPrompt = `Generate this week's strategic outreach plan in JSON format:

{
  "competitorAnalysis": [
    {
      "competitor": "Competitor name",
      "strengths": "What they do well",
      "opportunities": "How Jobs.al can differentiate"
    }
  ],
  "newCompanyTargets": [
    {
      "companyName": "Company name",
      "industry": "Industry",
      "priority": "High/Medium/Low",
      "reason": "Why target them this week"
    }
  ],
  "monthlyOutreachPlan": {
    "week1Focus": "Focus area for week 1",
    "week2Focus": "Focus area for week 2",
    "week3Focus": "Focus area for week 3",
    "week4Focus": "Focus area for week 4"
  },
  "sponsoredListingIdeas": [
    "Sponsored listing idea 1",
    "Sponsored listing idea 2",
    "Sponsored listing idea 3"
  ],
  "partnershipOpportunities": [
    {
      "organization": "Organization name",
      "type": "NGO/Agency/Large Org",
      "benefit": "Potential benefit",
      "approach": "How to approach them"
    }
  ]
}`;
    }

    console.log('Calling Lovable AI for marketing outreach...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`Lovable AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI Response received');

    let contentText = aiResponse.choices[0].message.content;
    
    // Strip markdown code blocks if present
    contentText = contentText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const generatedContent = JSON.parse(contentText);
    
    console.log('Marketing content generated successfully');

    // Save leads to database if daily task
    if (taskType === 'daily' && Array.isArray(generatedContent)) {
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

      console.log(`Saving ${generatedContent.length} leads to database...`);
      
      const saveResults = [];
      for (const lead of generatedContent) {
        try {
          const saveResponse = await fetch(`${SUPABASE_URL}/rest/v1/marketing_leads`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'apikey': SUPABASE_SERVICE_ROLE_KEY,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              lead_type: lead.lead_type,
              company_name: lead.company_name,
              university_name: lead.university_name,
              industry: lead.industry,
              contact_name: lead.contact_name,
              contact_email: lead.contact_email,
              linkedin_url: lead.linkedin_url,
              relevance_notes: lead.relevance_notes,
              draft_email: lead.draft_email,
              draft_linkedin: lead.draft_linkedin,
              current_stage: 'generated',
              priority: lead.priority,
              utm_campaign: lead.utm_campaign,
              created_by_agent_run_id: lead.created_by_agent_run_id || agentRunId
            })
          });

          if (saveResponse.ok) {
            const savedLead = await saveResponse.json();
            saveResults.push({ success: true, lead: savedLead });
            console.log(`✓ Saved: ${lead.company_name || lead.university_name}`);
          } else {
            const error = await saveResponse.text();
            console.error(`✗ Failed to save ${lead.company_name || lead.university_name}:`, error);
            saveResults.push({ success: false, error });
          }
        } catch (err) {
          console.error(`Error saving lead:`, err);
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          saveResults.push({ success: false, error: errorMessage });
        }
      }

      const successCount = saveResults.filter(r => r.success).length;
      console.log(`Saved ${successCount}/${generatedContent.length} leads successfully`);

      return new Response(
        JSON.stringify({
          success: true,
          content: generatedContent,
          taskType,
          savedLeads: successCount,
          totalLeads: generatedContent.length
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        content: generatedContent,
        taskType
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in marketing-outreach function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
