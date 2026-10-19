import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AwsClient } from "npm:aws4fetch@1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cloudflare R2 (website images live at the bucket root / images/)
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID");
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY");
const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID");
const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME");
const R2_PUBLIC_URL = (Deno.env.get("R2_PUBLIC_URL") || "").replace(/\/$/, "");

const r2Configured = !!(R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_ACCOUNT_ID && R2_BUCKET_NAME && R2_PUBLIC_URL);

async function uploadToR2(key: string, bytes: Uint8Array, contentType: string): Promise<string> {
  const aws = new AwsClient({
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
    service: "s3",
    region: "auto",
  });
  // R2_ACCOUNT_ID may be the bare account ID or the full endpoint URL — normalize it.
  const account = R2_ACCOUNT_ID!.replace(/^https?:\/\//, "")
    .replace(/\.r2\.cloudflarestorage\.com\/?$/, "")
    .replace(/\/$/, "");
  const resp = await aws.fetch(
    `https://${account}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`,
    { method: "PUT", headers: { "Content-Type": contentType }, body: bytes },
  );
  if (!resp.ok) throw new Error(`R2 upload failed: ${resp.status} ${await resp.text()}`);
  return `${R2_PUBLIC_URL}/${key}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
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

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      try {
        console.log(`Fetching image for: ${post.title}`);

        // Use Lorem Picsum for random professional-looking images
        // Use a seed based on the post id for consistent but varied images
        const seed = post.id.replace(/-/g, '').substring(0, 8);
        const picsumUrl = `https://picsum.photos/seed/${seed}/1200/630`;
        
        // Fetch the image
        const imageResponse = await fetch(picsumUrl, { 
          redirect: 'follow',
          headers: {
            'User-Agent': 'Jobs.al Blog Image Generator'
          }
        });
        
        if (!imageResponse.ok) {
          console.error(`Failed to fetch image for ${post.slug}: ${imageResponse.status}`);
          results.push({ slug: post.slug, success: false, error: `HTTP ${imageResponse.status}` });
          continue;
        }

        // Download the image
        const imageBuffer = new Uint8Array(await imageResponse.arrayBuffer());
        
        if (imageBuffer.length < 1000) {
          console.error(`Image too small for ${post.slug}`);
          results.push({ slug: post.slug, success: false, error: 'Image too small' });
          continue;
        }
        
        const fileName = `blog-${post.slug}-${Date.now()}.jpg`;

        let publicUrl: string;
        if (r2Configured) {
          // Website images go to Cloudflare R2
          publicUrl = await uploadToR2(fileName, imageBuffer, 'image/jpeg');
        } else {
          const { error: uploadError } = await supabase.storage
            .from('blog-images')
            .upload(fileName, imageBuffer, {
              contentType: 'image/jpeg',
              upsert: true,
            });

          if (uploadError) {
            console.error(`Upload failed for ${post.slug}:`, uploadError);
            results.push({ slug: post.slug, success: false, error: uploadError.message });
            continue;
          }

          const { data: publicUrlData } = supabase.storage
            .from('blog-images')
            .getPublicUrl(fileName);
          publicUrl = publicUrlData.publicUrl;
        }

        // Update post with image URL
        const { error: updateError } = await supabase
          .from('posts')
          .update({ featured_image: publicUrl })
          .eq('id', post.id);

        if (updateError) {
          console.error(`Update failed for ${post.slug}:`, updateError);
          results.push({ slug: post.slug, success: false, error: updateError.message });
          continue;
        }

        console.log(`Successfully added image for: ${post.title}`);
        results.push({ slug: post.slug, success: true, imageUrl: publicUrl });

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));

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
