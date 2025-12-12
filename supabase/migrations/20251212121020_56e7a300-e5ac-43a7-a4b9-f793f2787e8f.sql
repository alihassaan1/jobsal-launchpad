-- Email Templates Table
CREATE TABLE public.email_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  subject text NOT NULL,
  html_content text NOT NULL,
  category text NOT NULL DEFAULT 'transactional',
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Email Logs Table
CREATE TABLE public.email_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
  template_slug text NOT NULL,
  email_to text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- User Email Preferences Table
CREATE TABLE public.user_email_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  marketing_emails boolean DEFAULT true,
  job_alerts boolean DEFAULT true,
  application_updates boolean DEFAULT true,
  weekly_digest boolean DEFAULT true,
  resume_reminders boolean DEFAULT true,
  unsubscribed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Email Queue Table
CREATE TABLE public.email_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_slug text NOT NULL,
  scheduled_for timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  metadata jsonb DEFAULT '{}'::jsonb,
  processed_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_templates
CREATE POLICY "Admins can manage email templates" ON public.email_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active templates" ON public.email_templates
  FOR SELECT USING (is_active = true);

-- RLS Policies for email_logs
CREATE POLICY "Admins can manage all email logs" ON public.email_logs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own email logs" ON public.email_logs
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for user_email_preferences
CREATE POLICY "Users can manage their own preferences" ON public.user_email_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all preferences" ON public.user_email_preferences
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for email_queue
CREATE POLICY "Admins can manage email queue" ON public.email_queue
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX idx_email_logs_template_slug ON public.email_logs(template_slug);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
CREATE INDEX idx_email_queue_status ON public.email_queue(status);
CREATE INDEX idx_email_queue_scheduled_for ON public.email_queue(scheduled_for);

-- Trigger to update updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_email_preferences_updated_at
  BEFORE UPDATE ON public.user_email_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default email templates
INSERT INTO public.email_templates (name, slug, subject, html_content, category, description) VALUES
('Welcome Email', 'welcome', 'Mirë se vini në Jobs.al – Karriera juaj fillon këtu! 🎉', '', 'onboarding', 'Sent immediately after user signup'),
('Resume Reminder Day 3', 'resume-reminder-1', '{{name}}, puna juaj e ëndrrave po pret – por së pari, CV-ja juaj! 📄', '', 'engagement', 'Sent 3 days after signup if no resume'),
('Resume Reminder Day 7', 'resume-reminder-2', 'Pyetje e shpejtë, {{name}} – a jeni ende duke kërkuar punë? 🤔', '', 'engagement', 'Sent 7 days after signup if no resume'),
('Final Resume Nudge', 'resume-reminder-final', 'Mundësi e fundit! Punëdhënësit po kërkojnë kandidatë si ju 🔍', '', 'engagement', 'Sent 14 days after signup if no resume'),
('Weekly Job Digest', 'weekly-digest', '{{count}} punë të reja përputhen me profilin tuaj këtë javë! 💼', '', 'digest', 'Weekly personalized job recommendations'),
('Application Confirmation', 'application-confirmation', 'Aplikimi juaj u dërgua me sukses! ✅', '', 'transactional', 'Sent after successful job application'),
('Application Status Update', 'application-status', 'Përditësim për aplikimin tuaj tek {{company}}', '', 'transactional', 'Sent when application status changes'),
('Profile Incomplete', 'profile-incomplete', '{{name}}, plotësoni profilin për më shumë mundësi! 📋', '', 'engagement', 'Sent when profile is incomplete'),
('New Job Match', 'job-match', 'Punë e re që përputhet me aftësitë tuaja! 🎯', '', 'alerts', 'Sent when a matching job is posted'),
('Account Reactivation', 'reactivation', 'Na mungoni, {{name}}! Shihni çfarë keni humbur 👀', '', 'engagement', 'Sent after 30 days of inactivity');