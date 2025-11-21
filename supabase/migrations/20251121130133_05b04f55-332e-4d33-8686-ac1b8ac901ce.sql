-- Add meta_keywords field to posts table
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS meta_keywords text[] DEFAULT '{}';

COMMENT ON COLUMN public.posts.meta_keywords IS 'SEO meta keywords for the blog post';