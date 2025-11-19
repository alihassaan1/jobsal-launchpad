import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, keywords } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Generating blog post for topic:', topic);

    // Generate blog content using AI
    const contentResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `You are an expert content writer specializing in the Albanian job market and career advice. Write engaging, SEO-optimized blog posts in English that provide value to job seekers and employers in Albania.`
          },
          {
            role: 'user',
            content: `Write a comprehensive blog post about "${topic}" targeting these keywords: ${keywords.join(', ')}. 
            
            Requirements:
            - 800-1200 words
            - SEO-optimized with keywords naturally integrated
            - Include practical tips and actionable advice
            - Use engaging headers and subheaders
            - Write in a professional yet conversational tone
            - Focus on the Albanian job market context
            
            Format the response as JSON with these fields:
            - title: catchy SEO title (60 chars max)
            - meta_title: SEO title variation
            - meta_description: compelling meta description (150-160 chars)
            - excerpt: brief summary (150-200 chars)
            - content: full article in markdown format
            - category: main category (e.g., "Career Tips", "Job Market", "Resume Tips")
            - tags: array of 3-5 relevant tags`
          }
        ],
      }),
    });

    if (!contentResponse.ok) {
      const errorText = await contentResponse.text();
      console.error('AI content generation error:', errorText);
      throw new Error('Failed to generate blog content');
    }

    const contentData = await contentResponse.json();
    const blogContent = JSON.parse(contentData.choices[0].message.content);

    // Generate featured image using AI
    console.log('Generating featured image for:', blogContent.title);
    
    const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: `Create a professional, modern featured image for a blog post titled "${blogContent.title}". 
            Style: Professional business illustration, vibrant but not overwhelming colors, modern and clean design.
            Include elements related to: job search, career development, Albanian workplace culture.
            Aspect ratio: 16:9 for blog header. High quality, ultra high resolution.`
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!imageResponse.ok) {
      console.error('Image generation failed, will proceed without image');
    }

    let featuredImageUrl = null;
    if (imageResponse.ok) {
      const imageData = await imageResponse.json();
      const base64Image = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (base64Image) {
        // Upload image to Supabase Storage
        const imageBuffer = Uint8Array.from(atob(base64Image.split(',')[1]), c => c.charCodeAt(0));
        const fileName = `blog-${Date.now()}.png`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(fileName, imageBuffer, {
            contentType: 'image/png',
            upsert: false
          });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from('blog-images')
            .getPublicUrl(fileName);
          featuredImageUrl = urlData.publicUrl;
        }
      }
    }

    // Create blog post in database
    const slug = blogContent.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Get admin user ID (first admin user)
    const { data: adminData } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (!adminData) {
      throw new Error('No admin user found');
    }

    const { data: postData, error: postError } = await supabase
      .from('posts')
      .insert({
        title: blogContent.title,
        slug: slug,
        excerpt: blogContent.excerpt,
        content: blogContent.content,
        meta_title: blogContent.meta_title,
        meta_description: blogContent.meta_description,
        category: blogContent.category,
        tags: blogContent.tags,
        featured_image: featuredImageUrl,
        author_id: adminData.user_id,
        is_published: false, // Set to false for review
        language: 'en'
      })
      .select()
      .single();

    if (postError) {
      console.error('Error creating blog post:', postError);
      throw postError;
    }

    console.log('Blog post created successfully:', postData.id);

    return new Response(
      JSON.stringify({
        success: true,
        post: postData,
        message: 'Blog post generated successfully and saved as draft'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-blog-post function:', error);
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