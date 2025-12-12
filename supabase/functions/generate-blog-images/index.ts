import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get posts without featured images
    const { data: posts, error: fetchError } = await supabase
      .from('posts')
      .select('id, title, slug, category')
      .or('featured_image.is.null,featured_image.eq.')
      .limit(10);

    if (fetchError) throw fetchError;

    if (!posts || posts.length === 0) {
      return new Response(JSON.stringify({ message: 'All posts have images' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${posts.length} posts without images`);

    const results = [];

    for (const post of posts) {
      try {
        console.log(`Generating image for: ${post.title}`);

        // Create category-specific prompts for realistic blog images
        const categoryPrompts: Record<string, string> = {
          'Career Advice': 'Professional business person at modern office desk reviewing documents, laptop open, clean corporate environment, natural lighting, realistic photography style',
          'Job Search Tips': 'Job seeker preparing resume at home office, laptop and notebook, focused and determined expression, warm natural lighting, realistic photography',
          'Industry News': 'Modern Albanian business district skyline, contemporary office buildings, professional urban environment, daytime, realistic photography',
          'Interview Tips': 'Professional job interview scene, two people in business attire at meeting table, modern office background, natural lighting, realistic photography',
          'Workplace Culture': 'Diverse team collaborating in modern open office space, casual professional attire, engaged discussion, natural lighting, realistic photography',
          'default': 'Professional Albanian business environment, modern office setting, career development theme, natural lighting, realistic photography style'
        };

        const prompt = `${categoryPrompts[post.category] || categoryPrompts['default']}. Related to: ${post.title}. Ultra high resolution, 16:9 aspect ratio, professional blog header image.`;

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image-preview',
            messages: [{ role: 'user', content: prompt }],
            modalities: ['image', 'text'],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Image generation failed for ${post.slug}: ${errorText}`);
          results.push({ slug: post.slug, success: false, error: errorText });
          continue;
        }

        const data = await response.json();
        const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageData) {
          console.error(`No image data returned for ${post.slug}`);
          results.push({ slug: post.slug, success: false, error: 'No image data' });
          continue;
        }

        // Extract base64 data and upload to storage
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        const fileName = `blog-${post.slug}-${Date.now()}.png`;
        
        const { error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(fileName, imageBuffer, {
            contentType: 'image/png',
            upsert: true,
          });

        if (uploadError) {
          console.error(`Upload failed for ${post.slug}:`, uploadError);
          results.push({ slug: post.slug, success: false, error: uploadError.message });
          continue;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(fileName);

        // Update post with image URL
        const { error: updateError } = await supabase
          .from('posts')
          .update({ featured_image: publicUrlData.publicUrl })
          .eq('id', post.id);

        if (updateError) {
          console.error(`Update failed for ${post.slug}:`, updateError);
          results.push({ slug: post.slug, success: false, error: updateError.message });
          continue;
        }

        console.log(`Successfully generated image for: ${post.title}`);
        results.push({ slug: post.slug, success: true, imageUrl: publicUrlData.publicUrl });

        // Small delay between generations
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (postError) {
        console.error(`Error processing ${post.slug}:`, postError);
        results.push({ slug: post.slug, success: false, error: String(postError) });
      }
    }

    return new Response(JSON.stringify({ 
      message: `Processed ${posts.length} posts`,
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
