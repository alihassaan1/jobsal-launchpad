-- Create marketing_leads table
CREATE TABLE IF NOT EXISTS public.marketing_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_type TEXT NOT NULL CHECK (lead_type IN ('employer', 'university')),
  company_name TEXT,
  university_name TEXT,
  industry TEXT,
  contact_name TEXT,
  contact_email TEXT,
  linkedin_url TEXT,
  relevance_notes TEXT,
  draft_email TEXT NOT NULL,
  draft_linkedin TEXT NOT NULL,
  current_stage TEXT NOT NULL DEFAULT 'generated' CHECK (current_stage IN ('generated', 'email_sent', 'linkedin_contacted', 'followup_1', 'followup_2', 'followup_3', 'converted', 'unresponsive')),
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  utm_campaign TEXT NOT NULL,
  created_by_agent_run_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_lead UNIQUE (company_name, university_name, lead_type, contact_email)
);

-- Create marketing_outreach_attempts table
CREATE TABLE IF NOT EXISTS public.marketing_outreach_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.marketing_leads(id) ON DELETE CASCADE,
  attempt_type TEXT NOT NULL CHECK (attempt_type IN ('email', 'linkedin', 'followup_1', 'followup_2', 'followup_3')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  email_delivered BOOLEAN,
  email_opened BOOLEAN,
  email_clicked BOOLEAN,
  response_received BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create marketing_conversions table
CREATE TABLE IF NOT EXISTS public.marketing_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.marketing_leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  conversion_type TEXT NOT NULL CHECK (conversion_type IN ('signup', 'job_posted', 'subscription', 'partnership')),
  utm_source TEXT,
  utm_campaign TEXT,
  utm_medium TEXT,
  conversion_value NUMERIC,
  converted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_outreach_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_conversions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketing_leads
CREATE POLICY "Admins can manage all leads"
  ON public.marketing_leads
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for marketing_outreach_attempts
CREATE POLICY "Admins can manage all outreach attempts"
  ON public.marketing_outreach_attempts
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for marketing_conversions
CREATE POLICY "Admins can manage all conversions"
  ON public.marketing_conversions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_marketing_leads_stage ON public.marketing_leads(current_stage);
CREATE INDEX idx_marketing_leads_priority ON public.marketing_leads(priority);
CREATE INDEX idx_marketing_leads_type ON public.marketing_leads(lead_type);
CREATE INDEX idx_marketing_leads_created ON public.marketing_leads(created_at DESC);
CREATE INDEX idx_outreach_attempts_lead ON public.marketing_outreach_attempts(lead_id);
CREATE INDEX idx_conversions_lead ON public.marketing_conversions(lead_id);
CREATE INDEX idx_conversions_utm ON public.marketing_conversions(utm_campaign);

-- Create trigger for updated_at
CREATE TRIGGER update_marketing_leads_updated_at
  BEFORE UPDATE ON public.marketing_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();