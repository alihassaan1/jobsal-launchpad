import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { r2Configured, uploadImageToR2 } from "../_shared/r2.ts";
import { requireAdmin } from "../_shared/auth.ts";

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

    // Get a random blog author for this post
    const { data: blogAuthors } = await supabase
      .from('blog_authors')
      .select('id')
      .eq('is_active', true);
    
    let blogAuthorId = null;
    if (blogAuthors && blogAuthors.length > 0) {
      const randomIndex = Math.floor(Math.random() * blogAuthors.length);
      blogAuthorId = blogAuthors[randomIndex].id;
      console.log('Selected blog author:', blogAuthorId);
    }

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
            content: `You are an expert SEO content writer and career advisor specializing in the Albanian job market. 

Your content must be:
- Professionally written with perfect grammar and engaging tone
- Fully optimized for search engines (SEO best practices)
- Structured with clear H2 and H3 headings with GENEROUS spacing between sections
- Rich with actionable insights and data-driven advice
- Formatted in clean, semantic HTML with proper spacing and readability
- Targeted to both job seekers and employers in Albania
- Including internal linking opportunities where relevant
- Written in a conversational yet authoritative voice
- Look like it was written by a human with natural paragraph breaks and visual structure`
          },
          {
            role: "user",
            content: `Write a comprehensive, SEO-optimized blog post about "${topic}" for the Albanian job market. 

Target Keywords: ${keywords}

Requirements:
1. Length: 1200-1800 words (comprehensive and authoritative)
2. Title: Compelling, keyword-rich, under 60 characters
3. Meta Title: Optimized for Google SERP, 50-60 characters
4. Meta Description: Persuasive with keywords, 150-160 characters
5. Excerpt: Engaging hook, 180-200 characters
6. Structure & Formatting (CRITICAL):
   - Opening paragraph with hook and keyword (2-3 paragraphs)
   - Multiple H2 sections with 2-3 H3 subsections each
   - GENEROUS spacing: wrap each paragraph in <p> tags with margin-bottom classes
   - Use <br> tags sparingly for extra visual breaks between major sections
   - Bullet points (<ul><li>) and numbered lists (<ol><li>) for readability
   - Use tables (<table>) where data comparison makes sense (e.g., salary comparisons, skill requirements, company benefits)
   - Bold key terms with <strong> tags
   - Italicize emphasis with <em> tags
   - Internal linking suggestions (use placeholder URLs like /jobs, /resume-builder)
   - Strong conclusion with call-to-action
7. HTML Formatting Standards:
   - Each paragraph must be in <p class="mb-4"> or <p class="mb-6"> for spacing
   - Each H2 must have <h2 class="text-2xl font-bold mt-8 mb-4">
   - Each H3 must have <h3 class="text-xl font-semibold mt-6 mb-3">
   - Lists must have proper spacing: <ul class="list-disc pl-6 mb-4 space-y-2">
   - Tables must use: <table class="w-full border-collapse border border-gray-300 my-6">
   - Make it look professionally formatted and human-written, not compressed AI text
8. SEO Elements:
   - Primary keyword in first 100 words
   - Secondary keywords naturally distributed
   - LSI keywords related to Albanian job market
   - Rich snippets opportunities (FAQs, How-tos)
9. Content Quality:
   - Actionable advice with specific examples
   - Albanian market statistics and trends (use realistic 2025 data)
   - Real-world scenarios
   - Expert tips and best practices
   - When appropriate, include comparison tables (e.g., job roles vs salaries, skills vs industries)

Return ONLY a valid JSON object with this exact structure:
{
  "title": "SEO-optimized title with primary keyword",
  "metaTitle": "Meta title for Google SERP (50-60 chars)",
  "metaDescription": "Persuasive meta description with keywords (150-160 chars)",
  "metaKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "excerpt": "Engaging excerpt that hooks readers (180-200 chars)",
  "content": "Full HTML content with proper spacing classes, <h2>, <h3>, <p class='mb-4'>, <ul class='list-disc pl-6 mb-4 space-y-2'>, <ol>, <table>, <strong>, <em>, <a> tags. Must look professionally formatted with generous spacing. Include 5-7 major sections with subsections.",
  "category": "One of: Career Advice, Job Market Trends, Interview Tips, Resume Building, Employer Insights, Salary Guide, Industry Analysis",
  "tags": ["primary-keyword", "secondary-keyword", "related-keyword", "albania-jobs", "specific-industry"]
}`
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
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
            content: `Create a high-quality, professional featured image for a blog post titled "${generatedContent.title}".

Topic: ${topic}
Keywords: ${keywords}

Requirements:
- Professional and modern design aesthetic
- Directly related to ${topic} in the Albanian job market context
- High resolution and crisp quality (1200x630px optimal for social media)
- Engaging composition that attracts clicks
- Use professional business/career imagery
- Incorporate subtle Albanian elements if relevant (colors, landmarks, cultural touches)
- Clean, uncluttered layout
- Text overlay should be minimal or none
- Suitable for LinkedIn, Facebook, and blog headers
- Color palette: Professional blues, greens, or warm tones
- Style: Contemporary, corporate, trustworthy

The image should make viewers want to read the article about ${topic}.`
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

    // Upload image to Cloudflare R2 (falls back to Supabase storage)
    const base64Data = imageBase64.split(",")[1];
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const fileName = `blog-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

    console.log("Uploading image to storage...");
    let publicUrl: string;
    if (r2Configured) {
      publicUrl = await uploadImageToR2(`images/blog/${fileName}`, imageBuffer, "image/png");
    } else {
      const { error: uploadError } = await supabase.storage
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

      const { data: { publicUrl: supaUrl } } = supabase.storage
        .from("blog-images")
        .getPublicUrl(fileName);
      publicUrl = supaUrl;
    }

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
        meta_keywords: generatedContent.metaKeywords || [],
        featured_image: publicUrl,
        meta_title: generatedContent.metaTitle,
        meta_description: generatedContent.metaDescription,
        author_id: userId,
        blog_author_id: blogAuthorId,
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
              content: "You are a social media expert creating engaging, viral-worthy Facebook posts for Albanian job market content. Your posts drive clicks and engagement."
            },
            {
              role: "user",
              content: `Create a highly engaging Facebook post for this blog article.

Blog Title: "${generatedContent.title}"
Topic: ${topic}
Target Audience: Albanian job seekers, employers, and HR professionals

Requirements:
- Length: 200-280 characters (Facebook optimal length)
- Include 2-4 relevant emojis strategically placed
- Start with a hook that grabs attention
- Include the main benefit/value proposition
- End with a strong call-to-action
- Use conversational Albanian-friendly language
- Create urgency or curiosity
- Mention "Jobs.al" naturally

Tone: Professional yet friendly, encouraging, action-oriented
Goal: Maximum clicks and shares

Return ONLY the Facebook post text, no JSON, no explanations.`
            }
          ],
          temperature: 0.8,
          max_tokens: 200
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
              content: `Create a professional, data-driven infographic about Albanian job market trends and statistics.

Topic Focus: ${topic}
Keywords: ${keywords}

Requirements:
- Square format: 1080x1080px (Instagram/Facebook optimized)
- Professional design with modern aesthetics
- Include 5-7 key data points or statistics
- Use charts/graphs (pie charts, bar graphs, trend lines)
- Color scheme: Professional blues, teals, or brand colors
- Clean typography and hierarchy
- Incorporate Albanian flag colors subtly (red/black accents)
- Include Jobs.al branding
- Data visualization best practices
- White space and readability
- Mobile-friendly text sizes
- Shareable and engaging design
- Include year "2025" in statistics
- Focus on: employment rates, salary ranges, top industries, job growth, skills in demand

Style: Corporate infographic, modern, trustworthy, data-focused
The infographic should be highly shareable and valuable for job seekers and employers in Albania.`
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

          if (r2Configured) {
            infographicUrl = await uploadImageToR2(`images/blog/${infographicFileName}`, infographicBuffer, "image/png");
            console.log("Infographic created:", infographicUrl);
          } else {
            const { error: infographicUploadError } = await supabase.storage
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
