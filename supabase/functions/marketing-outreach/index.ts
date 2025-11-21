import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const systemPrompt = `You are the Marketing & Outreach AI Agent for Jobs.al, Albania's premier job portal.

Your responsibility is to help grow Jobs.al by creating outreach messages, identifying leads, and generating marketing content.

Your Main Goals:
- Bring Albanian universities onto Jobs.al as partners
- Reach out to employers and HR managers
- Help grow student registrations
- Increase job postings from Albanian companies
- Prepare content for LinkedIn, email, and social media

Tone & Style:
- Professional, friendly, and clear
- No exaggerated language
- Keep messages short and direct
- Avoid pressure tactics
- Focus on value for employers, students, and universities

IMPORTANT: Generate REAL Albanian companies, universities, and organizations. Use your knowledge of Albania's business landscape.`;

    let userPrompt = '';
    
    if (taskType === 'daily') {
      userPrompt = `Generate today's daily outreach tasks in JSON format with this exact structure:

{
  "employerLeads": [
    {
      "companyName": "Company name",
      "industry": "Industry type",
      "jobTypes": "Types of jobs they hire",
      "relevance": "Why Jobs.al is relevant to them",
      "emailDraft": "Professional email outreach message",
      "linkedinDraft": "LinkedIn message (max 300 chars)"
    }
  ],
  "universityLeads": [
    {
      "universityName": "University or Faculty name",
      "department": "Department to target",
      "contactInfo": "Email or contact department",
      "emailDraft": "Collaboration invitation email",
      "pitch": "Short pitch explaining student benefits"
    }
  ],
  "marketingContent": {
    "linkedinPost": "Engaging LinkedIn post for Jobs.al",
    "instagramCaption": "Instagram caption with hashtags",
    "websitePromo": "Short promotional message for website/Facebook"
  },
  "followUpTemplates": {
    "day2": "Follow-up template after 2 days",
    "day7": "Follow-up template after 7 days",
    "day14": "Follow-up template after 14 days"
  },
  "studentGrowthIdeas": [
    "Actionable idea 1",
    "Actionable idea 2",
    "Actionable idea 3"
  ]
}

Provide 10 real Albanian employer leads and 3-5 real Albanian universities.`;
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
