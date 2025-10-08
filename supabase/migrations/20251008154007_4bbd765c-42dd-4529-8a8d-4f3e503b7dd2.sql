-- Add slug to resume_templates for SEO-friendly URLs
ALTER TABLE public.resume_templates ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_resume_templates_slug ON public.resume_templates(slug);

-- Create resumes table for storing user-created resumes
CREATE TABLE IF NOT EXISTS public.resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.resume_templates(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT 'My Resume',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  extracted_data jsonb DEFAULT '{}'::jsonb,
  ai_match_score numeric CHECK (ai_match_score >= 0 AND ai_match_score <= 100),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on resumes table
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resumes table
CREATE POLICY "Users can view their own resumes"
  ON public.resumes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resumes"
  ON public.resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resumes"
  ON public.resumes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resumes"
  ON public.resumes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all resumes"
  ON public.resumes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Employers can view resumes from applications
CREATE POLICY "Employers can view resumes from applications"
  ON public.resumes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      JOIN public.companies c ON c.id = j.company_id
      WHERE a.applicant_id = resumes.user_id
        AND c.owner_id = auth.uid()
    )
  );

-- Add trigger for updated_at on resumes
CREATE TRIGGER update_resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX idx_resumes_template_id ON public.resumes(template_id);
CREATE INDEX idx_resumes_created_at ON public.resumes(created_at DESC);

-- Insert sample resume templates
INSERT INTO public.resume_templates (name, slug, description, category, is_premium, is_active, preview_url, template_data)
VALUES 
  (
    'Professional Modern',
    'professional-modern',
    'Clean and modern template perfect for corporate roles and professional positions',
    'professional',
    false,
    true,
    '/templates/preview/professional-modern.png',
    '{"layout": "single-column", "colors": {"primary": "#2563eb", "secondary": "#64748b"}, "fonts": {"heading": "Inter", "body": "Inter"}}'::jsonb
  ),
  (
    'Creative Portfolio',
    'creative-portfolio',
    'Stand out with this creative design ideal for designers and creative professionals',
    'creative',
    true,
    true,
    '/templates/preview/creative-portfolio.png',
    '{"layout": "two-column", "colors": {"primary": "#8b5cf6", "secondary": "#ec4899"}, "fonts": {"heading": "Playfair Display", "body": "Inter"}}'::jsonb
  ),
  (
    'Executive Premium',
    'executive-premium',
    'Sophisticated template for senior executives and C-level positions',
    'executive',
    true,
    true,
    '/templates/preview/executive-premium.png',
    '{"layout": "two-column-reverse", "colors": {"primary": "#0f172a", "secondary": "#475569"}, "fonts": {"heading": "Merriweather", "body": "Source Sans Pro"}}'::jsonb
  ),
  (
    'Tech Minimal',
    'tech-minimal',
    'Minimalist design perfect for developers and tech professionals',
    'tech',
    false,
    true,
    '/templates/preview/tech-minimal.png',
    '{"layout": "single-column", "colors": {"primary": "#10b981", "secondary": "#059669"}, "fonts": {"heading": "JetBrains Mono", "body": "Inter"}}'::jsonb
  ),
  (
    'Academic Scholar',
    'academic-scholar',
    'Traditional format ideal for academic and research positions',
    'academic',
    true,
    true,
    '/templates/preview/academic-scholar.png',
    '{"layout": "single-column", "colors": {"primary": "#1e40af", "secondary": "#3b82f6"}, "fonts": {"heading": "Crimson Text", "body": "Lora"}}'::jsonb
  )
ON CONFLICT (slug) DO NOTHING;