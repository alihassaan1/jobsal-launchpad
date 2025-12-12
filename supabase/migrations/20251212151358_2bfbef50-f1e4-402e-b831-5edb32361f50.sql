-- Create enum for ad product types
CREATE TYPE public.ad_product_type AS ENUM (
  'featured_job',
  'priority_placement', 
  'daily_spotlight',
  'newsletter_spot',
  'social_promotion'
);

-- Create enum for ad purchase status
CREATE TYPE public.ad_purchase_status AS ENUM (
  'pending',
  'active',
  'expired',
  'cancelled'
);

-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM (
  'pending',
  'completed',
  'failed',
  'refunded'
);

-- Create enum for payment method
CREATE TYPE public.payment_method AS ENUM (
  'stripe',
  'paypal',
  'bank_transfer'
);

-- Create enum for discount type
CREATE TYPE public.discount_type AS ENUM (
  'percentage',
  'fixed'
);

-- 1. Ad Products Table
CREATE TABLE public.ad_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  product_type public.ad_product_type NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 7,
  price INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Promo Codes Table
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type public.discount_type NOT NULL DEFAULT 'percentage',
  discount_value INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  min_purchase_amount INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  applicable_products JSONB DEFAULT '"all"'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Ad Purchases Table
CREATE TABLE public.ad_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  ad_product_id UUID REFERENCES public.ad_products(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status public.ad_purchase_status DEFAULT 'pending',
  amount_paid INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  payment_method public.payment_method,
  payment_reference TEXT,
  promo_code_id UUID REFERENCES public.promo_codes(id),
  discount_applied INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Ad Analytics Table
CREATE TABLE public.ad_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_purchase_id UUID REFERENCES public.ad_purchases(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id),
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Payment Transactions Table
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  company_id UUID REFERENCES public.companies(id),
  ad_purchase_id UUID REFERENCES public.ad_purchases(id),
  subscription_id UUID REFERENCES public.subscriptions(id),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  payment_method public.payment_method NOT NULL,
  payment_provider_id TEXT,
  status public.payment_status DEFAULT 'pending',
  receipt_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.ad_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ad_products
CREATE POLICY "Anyone can view active ad products"
ON public.ad_products FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage ad products"
ON public.ad_products FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for promo_codes
CREATE POLICY "Anyone can view active promo codes"
ON public.promo_codes FOR SELECT
USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

CREATE POLICY "Admins can manage promo codes"
ON public.promo_codes FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for ad_purchases
CREATE POLICY "Users can view their own ad purchases"
ON public.ad_purchases FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Company owners can view their company ad purchases"
ON public.ad_purchases FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.companies
  WHERE companies.id = ad_purchases.company_id
  AND companies.owner_id = auth.uid()
));

CREATE POLICY "Users can create ad purchases for their companies"
ON public.ad_purchases FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE companies.id = ad_purchases.company_id
    AND companies.owner_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all ad purchases"
ON public.ad_purchases FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for ad_analytics
CREATE POLICY "Anyone can insert ad analytics"
ON public.ad_analytics FOR INSERT
WITH CHECK (true);

CREATE POLICY "Company owners can view their ad analytics"
ON public.ad_analytics FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.ad_purchases ap
  JOIN public.companies c ON c.id = ap.company_id
  WHERE ap.id = ad_analytics.ad_purchase_id
  AND c.owner_id = auth.uid()
));

CREATE POLICY "Admins can view all ad analytics"
ON public.ad_analytics FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view their own transactions"
ON public.payment_transactions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all transactions"
ON public.payment_transactions FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_ad_purchases_company_id ON public.ad_purchases(company_id);
CREATE INDEX idx_ad_purchases_job_id ON public.ad_purchases(job_id);
CREATE INDEX idx_ad_purchases_status ON public.ad_purchases(status);
CREATE INDEX idx_ad_purchases_end_date ON public.ad_purchases(end_date);
CREATE INDEX idx_ad_analytics_ad_purchase_id ON public.ad_analytics(ad_purchase_id);
CREATE INDEX idx_ad_analytics_event_type ON public.ad_analytics(event_type);
CREATE INDEX idx_ad_analytics_created_at ON public.ad_analytics(created_at);
CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);

-- Insert default ad products
INSERT INTO public.ad_products (name, slug, description, product_type, duration_days, price, currency, features, display_order) VALUES
('Featured Job - 7 Days', 'featured-7', 'Highlight your job at the top of search results for 7 days', 'featured_job', 7, 2900, 'EUR', '["Top placement in search", "Featured badge", "Priority visibility"]', 1),
('Featured Job - 14 Days', 'featured-14', 'Highlight your job at the top of search results for 14 days', 'featured_job', 14, 4900, 'EUR', '["Top placement in search", "Featured badge", "Priority visibility", "10% more views"]', 2),
('Featured Job - 30 Days', 'featured-30', 'Highlight your job at the top of search results for 30 days', 'featured_job', 30, 7900, 'EUR', '["Top placement in search", "Featured badge", "Priority visibility", "25% more views", "Social media boost"]', 3),
('Priority Placement', 'priority', 'Jobs appear before standard listings', 'priority_placement', 14, 3900, 'EUR', '["Highlighted listing", "Priority in category", "Enhanced visibility"]', 4),
('Daily Spotlight', 'spotlight', 'Rotating homepage slot for maximum visibility', 'daily_spotlight', 1, 1500, 'EUR', '["Homepage feature", "Maximum exposure", "Premium badge"]', 5),
('Newsletter Feature', 'newsletter', 'Prominent placement in weekly newsletter', 'newsletter_spot', 7, 2500, 'EUR', '["Email to 10k+ subscribers", "Direct link to job", "Company logo featured"]', 6),
('Social Media Boost', 'social', 'Promoted on Jobs.al Facebook & Instagram', 'social_promotion', 7, 3500, 'EUR', '["Facebook post", "Instagram story", "Targeted reach"]', 7);

-- Create trigger for updated_at
CREATE TRIGGER update_ad_products_updated_at
  BEFORE UPDATE ON public.ad_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ad_purchases_updated_at
  BEFORE UPDATE ON public.ad_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();