import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Albanian job market topics for automated generation
const BLOG_TOPICS = [
  "Remote Work Opportunities in Albania 2025",
  "Top Skills Albanian Employers Are Looking For",
  "Salary Negotiation Tips for Albanian Job Seekers",
  "Career Growth in Albania's Tech Industry",
  "How to Build a Professional Network in Albania",
  "Entry-Level Jobs in Tirana: Complete Guide",
  "Digital Marketing Careers in Albania",
  "Finance and Banking Jobs in Albania",
  "Engineering Opportunities in Albanian Market",
  "Tourism and Hospitality Careers in Albania",
  "Healthcare Professional Jobs in Albania",
  "Freelancing vs Full-Time Employment in Albania",
  "Interview Preparation Tips for Albanian Companies",
  "Work-Life Balance in Albanian Companies",
  "Albanian Job Market Trends 2025",
  "Starting Your Career Fresh Out of University in Albania",
  "Mid-Career Change Strategies for Albanian Professionals",
  "Leadership and Management Roles in Albania",
  "Customer Service Excellence in Albanian Market",
  "Sales Career Path in Albania",
  "How to Stand Out to Albanian Recruiters",
  "Professional Development Opportunities in Albania",
  "Internship Programs in Albanian Companies",
  "Part-Time Job Opportunities in Albania",
  "Contract vs Permanent Employment in Albania"
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting automated blog post generation...");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the first admin user to use as author
    const { data: adminRole, error: adminError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .single();

    if (adminError || !adminRole) {
      console.error("No admin user found:", adminError);
      throw new Error("No admin user found for blog authorship");
    }

    const userId = adminRole.user_id;

    // Select a random topic
    const randomTopic = BLOG_TOPICS[Math.floor(Math.random() * BLOG_TOPICS.length)];
    
    // Generate relevant keywords based on the topic
    const keywords = generateKeywords(randomTopic);

    console.log("Selected topic:", randomTopic);
    console.log("Generated keywords:", keywords);

    // Call the generate-blog-post function
    const { data, error } = await supabase.functions.invoke("generate-blog-post", {
      body: {
        topic: randomTopic,
        keywords: keywords,
        userId: userId,
        generateFacebookPost: true,
        generateInfographic: true
      }
    });

    if (error) {
      console.error("Error generating blog post:", error);
      throw error;
    }

    console.log("Blog post generated successfully:", data);

    // Auto-publish the post
    if (data?.post?.id) {
      const { error: publishError } = await supabase
        .from("posts")
        .update({ 
          is_published: true,
          published_at: new Date().toISOString()
        })
        .eq("id", data.post.id);

      if (publishError) {
        console.error("Error publishing post:", publishError);
      } else {
        console.log("Post published automatically");
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        topic: randomTopic,
        post: data?.post,
        message: "Automated blog post generated and published successfully"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in auto-generate-blog function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function generateKeywords(topic: string): string {
  const baseKeywords = [
    "jobs in Albania",
    "Albanian job market",
    "careers Albania",
    "employment Albania",
    "work in Albania"
  ];

  // Extract key terms from topic
  const topicWords = topic.toLowerCase()
    .replace(/\d{4}/g, '') // remove years
    .split(/[\s:]+/)
    .filter(word => word.length > 4 && !['guide', 'complete', 'tips'].includes(word));

  // Combine topic-specific and general keywords
  const keywords = [...new Set([...topicWords.slice(0, 3), ...baseKeywords.slice(0, 2)])];
  
  return keywords.join(', ');
}
