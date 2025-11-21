import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, keywords, userId, generateFacebookPost, generateInfographic } = await req.json();

    if (!topic || !keywords) {
      throw new Error("Topic and keywords are required");
    }

    console.log("Generating blog post for topic:", topic);
    console.log("Keywords:", keywords);
    console.log("Generate Facebook post:", generateFacebookPost);
    console.log("Generate infographic:", generateInfographic);

    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!DEEPSEEK_API_KEY || !LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generate blog content using DeepSeek
    console.log("Calling DeepSeek API for content generation...");
    const contentResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are an expert content writer specializing in the Albanian job market, career advice, and employment trends. Write engaging, informative blog posts in English with SEO optimization in mind."
          },
          {
            role: "user",
            content: `Write a comprehensive blog post about "${topic}" for the Albanian job market. 
            
Focus on these keywords: ${keywords}.

The blog post should:
1. Be 800-1200 words
2. Include an engaging title (max 60 characters)
3. Have a compelling meta description (max 160 characters)
4. Include a brief excerpt (150-200 characters)
5. Be structured with clear headings
6. Provide actionable insights
7. Be relevant to job seekers and employers in Albania

Return a JSON object with this structure:
{
  "title": "SEO-optimized title",
  "metaTitle": "Meta title for SEO",
  "metaDescription": "Meta description for SEO",
  "excerpt": "Brief excerpt",
  "content": "Full blog post content in HTML format with proper headings and paragraphs",
  "category": "One of: Career Advice, Job Market Trends, Interview Tips, Resume Building, Employer Insights",
  "tags": ["tag1", "tag2", "tag3"]
}`
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    });

    if (!contentResponse.ok) {
      const error = await contentResponse.text();
      console.error("DeepSeek API error:", error);
      throw new Error("Failed to generate content with DeepSeek");
    }

    const contentData = await contentResponse.json();
    let rawContent = contentData.choices[0].message.content;
    console.log("Raw DeepSeek response:", rawContent);

    // Strip markdown code blocks if present
    rawContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const generatedContent = JSON.parse(rawContent);
    console.log("Content generated successfully");

    // Generate featured image using Lovable AI
    console.log("Generating featured image...");
    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: `Generate a professional, high-quality featured image for a blog post about "${topic}" in the Albanian job market. The image should be modern, professional, and relevant to career/employment themes. Size: 1200x630px for optimal social media sharing.`
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!imageResponse.ok) {
      console.error("Image generation failed:", await imageResponse.text());
      throw new Error("Failed to generate image");
    }

    const imageData = await imageResponse.json();
    const imageBase64 = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      throw new Error("No image generated");
    }

    // Upload image to Supabase storage
    const base64Data = imageBase64.split(",")[1];
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const fileName = `blog-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

    console.log("Uploading image to storage...");
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("blog-images")
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: false
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload image to storage");
    }

    const { data: { publicUrl } } = supabase.storage
      .from("blog-images")
      .getPublicUrl(fileName);

    console.log("Image uploaded successfully:", publicUrl);

    // Create slug from title
    const slug = generatedContent.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Insert blog post into database
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .insert({
        title: generatedContent.title,
        slug: slug,
        content: generatedContent.content,
        excerpt: generatedContent.excerpt,
        category: generatedContent.category,
        tags: generatedContent.tags,
        featured_image: publicUrl,
        meta_title: generatedContent.metaTitle,
        meta_description: generatedContent.metaDescription,
        author_id: userId,
        is_published: false,
        language: 'en'
      })
      .select()
      .single();

    if (postError) {
      console.error("Database error:", postError);
      throw new Error("Failed to save blog post");
    }

    console.log("Blog post created successfully:", postData.id);

    let facebookPostContent = null;
    let infographicUrl = null;

    // Generate Facebook post if requested
    if (generateFacebookPost) {
      console.log("Generating Facebook post...");
      const fbResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "You are a social media expert creating engaging Facebook posts for Albanian job market content."
            },
            {
              role: "user",
              content: `Create an engaging Facebook post (max 250 characters) for this blog: "${generatedContent.title}". Include relevant emojis and a call-to-action. Make it engaging for the Albanian audience.`
            }
          ],
          temperature: 0.8,
          max_tokens: 150
        })
      });

      if (fbResponse.ok) {
        const fbData = await fbResponse.json();
        let fbContent = fbData.choices[0].message.content;
        
        // Strip markdown code blocks if present
        fbContent = fbContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        facebookPostContent = fbContent;
        console.log("Facebook post generated:", facebookPostContent);
      }
    }

    // Generate infographic if requested
    if (generateInfographic) {
      console.log("Generating infographic...");
      const infographicResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [
            {
              role: "user",
              content: `Create a professional infographic about Albanian job market trends and statistics. The infographic should be visually appealing, data-driven, and suitable for Instagram and Facebook posting. Include charts, statistics, and key insights about employment in Albania. Size: 1080x1080px (square format for Instagram). Use professional colors and modern design.`
            }
          ],
          modalities: ["image", "text"]
        })
      });

      if (infographicResponse.ok) {
        const infographicData = await infographicResponse.json();
        const infographicBase64 = infographicData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (infographicBase64) {
          const infographicBuffer = Uint8Array.from(atob(infographicBase64.split(",")[1]), c => c.charCodeAt(0));
          const infographicFileName = `infographic-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

          const { data: infographicUpload, error: infographicUploadError } = await supabase.storage
            .from("blog-images")
            .upload(infographicFileName, infographicBuffer, {
              contentType: "image/png",
              cacheControl: "3600",
              upsert: false
            });

          if (!infographicUploadError) {
            const { data: { publicUrl: infographicPublicUrl } } = supabase.storage
              .from("blog-images")
              .getPublicUrl(infographicFileName);
            
            infographicUrl = infographicPublicUrl;
            console.log("Infographic created:", infographicUrl);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        post: postData,
        facebookPost: facebookPostContent,
        infographic: infographicUrl,
        message: "Blog post generated successfully! Images stored in Supabase storage."
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in generate-blog-post function:", error);
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
