-- Add new fields to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS slug text UNIQUE,
ADD COLUMN IF NOT EXISTS banner_url text,
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_sponsored boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sponsorship_plan text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS followers_count integer DEFAULT 0;

-- Create company_followers table
CREATE TABLE IF NOT EXISTS public.company_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Enable RLS on company_followers
ALTER TABLE public.company_followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_followers
CREATE POLICY "Users can view all followers"
ON public.company_followers FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can follow companies"
ON public.company_followers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow companies"
ON public.company_followers FOR DELETE
USING (auth.uid() = user_id);

-- Create sponsored_content table
CREATE TABLE IF NOT EXISTS public.sponsored_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on sponsored_content
ALTER TABLE public.sponsored_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sponsored_content
CREATE POLICY "Anyone can view active sponsored content"
ON public.sponsored_content FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage sponsored content"
ON public.sponsored_content FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add sponsorship fields to posts table
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS is_sponsored boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

-- Function to increment company views
CREATE OR REPLACE FUNCTION public.increment_company_views(company_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.companies
  SET views_count = views_count + 1
  WHERE slug = company_slug;
END;
$$;

-- Function to update follower count
CREATE OR REPLACE FUNCTION public.update_company_follower_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.companies
    SET followers_count = followers_count + 1
    WHERE id = NEW.company_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.companies
    SET followers_count = followers_count - 1
    WHERE id = OLD.company_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger for follower count
DROP TRIGGER IF EXISTS update_company_follower_count_trigger ON public.company_followers;
CREATE TRIGGER update_company_follower_count_trigger
AFTER INSERT OR DELETE ON public.company_followers
FOR EACH ROW EXECUTE FUNCTION public.update_company_follower_count();

-- Generate slugs for existing companies
UPDATE public.companies
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;