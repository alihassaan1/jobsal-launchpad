-- Create posts table for blog system
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'al')),
  author_id UUID NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  is_published BOOLEAN NOT NULL DEFAULT false,
  meta_title TEXT,
  meta_description TEXT,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for better performance
CREATE INDEX idx_posts_slug ON public.posts(slug);
CREATE INDEX idx_posts_published ON public.posts(is_published, published_at DESC);
CREATE INDEX idx_posts_category ON public.posts(category);
CREATE INDEX idx_posts_language ON public.posts(language);
CREATE INDEX idx_posts_author ON public.posts(author_id);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Public can view published posts
CREATE POLICY "Anyone can view published posts"
ON public.posts
FOR SELECT
USING (is_published = true);

-- Admins and editors can view all posts
CREATE POLICY "Admins and editors can view all posts"
ON public.posts
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'editor'::app_role)
);

-- Admins and editors can create posts
CREATE POLICY "Admins and editors can create posts"
ON public.posts
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'editor'::app_role)
);

-- Authors, admins and editors can update their own posts
CREATE POLICY "Authors and admins can update posts"
ON public.posts
FOR UPDATE
USING (
  auth.uid() = author_id OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'editor'::app_role)
);

-- Only admins can delete posts
CREATE POLICY "Admins can delete posts"
ON public.posts
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to increment post views
CREATE OR REPLACE FUNCTION public.increment_post_views(post_slug TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.posts
  SET views_count = views_count + 1
  WHERE slug = post_slug AND is_published = true;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();