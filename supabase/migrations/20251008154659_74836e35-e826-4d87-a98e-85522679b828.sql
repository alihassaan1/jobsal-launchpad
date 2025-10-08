-- Create subscription_plans table for managing tiers
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_yearly INTEGER NOT NULL DEFAULT 0,
  job_posts_limit INTEGER NOT NULL DEFAULT 0,
  featured_jobs_limit INTEGER NOT NULL DEFAULT 0,
  resume_views_limit INTEGER NOT NULL DEFAULT 0,
  ats_access BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Anyone can view active plans
CREATE POLICY "Anyone can view active subscription plans"
  ON public.subscription_plans
  FOR SELECT
  USING (is_active = true);

-- Admins can manage plans
CREATE POLICY "Admins can manage subscription plans"
  ON public.subscription_plans
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default subscription tiers
INSERT INTO public.subscription_plans (name, slug, description, price_monthly, price_yearly, job_posts_limit, featured_jobs_limit, resume_views_limit, ats_access, priority_support, display_order) VALUES
  ('Free', 'free', 'Perfect for testing the platform', 0, 0, 1, 0, 10, false, false, 1),
  ('Basic', 'basic', 'Great for small businesses', 4900, 49000, 5, 1, 50, true, false, 2),
  ('Pro', 'pro', 'Ideal for growing companies', 9900, 99000, 20, 5, 200, true, true, 3),
  ('Premium', 'premium', 'For enterprise recruitment', 19900, 199000, -1, 20, -1, true, true, 4);

-- Create admin_settings table for storing Stripe keys and other config
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  is_encrypted BOOLEAN DEFAULT false,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage settings
CREATE POLICY "Admins can manage settings"
  ON public.admin_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert Stripe config placeholders
INSERT INTO public.admin_settings (key, value, description, is_encrypted) VALUES
  ('stripe_secret_key', NULL, 'Stripe Secret Key for payment processing', true),
  ('stripe_publishable_key', NULL, 'Stripe Publishable Key for frontend', false),
  ('stripe_webhook_secret', NULL, 'Stripe Webhook Secret for event verification', true);

-- Add trigger for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update subscriptions table to link to plan
ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.subscription_plans(id);

-- Function to check if user can post job based on subscription
CREATE OR REPLACE FUNCTION public.can_post_job(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_jobs_count INTEGER;
  job_limit INTEGER;
BEGIN
  -- Get current active jobs count
  SELECT COUNT(*) INTO current_jobs_count
  FROM public.jobs j
  JOIN public.companies c ON j.company_id = c.id
  WHERE c.owner_id = user_id AND j.is_active = true;
  
  -- Get job posting limit from subscription
  SELECT COALESCE(s.job_posts_limit, 1) INTO job_limit
  FROM public.subscriptions s
  WHERE s.user_id = user_id AND s.status = 'active'
  LIMIT 1;
  
  -- -1 means unlimited
  IF job_limit = -1 THEN
    RETURN true;
  END IF;
  
  RETURN current_jobs_count < job_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;