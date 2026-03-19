
-- Add new email template records
INSERT INTO public.email_templates (name, slug, subject, html_content, category, description)
VALUES
  ('Employer Welcome', 'employer-welcome', 'Mirë se vini në Jobs.al si Punëdhënës!', '<p>Template managed in edge function</p>', 'transactional', 'Onboarding email for new employers with company setup guide'),
  ('Job Expiring Soon', 'job-expiring', 'Puna që ju intereson po skadon së shpejti!', '<p>Template managed in edge function</p>', 'transactional', 'Alert for candidates when a job they viewed is about to expire'),
  ('New Applicant Notification', 'new-applicant', 'Keni një aplikant të ri!', '<p>Template managed in edge function</p>', 'transactional', 'Notifies employer when a candidate applies to their job'),
  ('Interview Scheduled', 'interview-scheduled', 'Intervista juaj është konfirmuar!', '<p>Template managed in edge function</p>', 'transactional', 'Confirms interview details to candidate');

-- Add new preference columns for employer notifications and job expiring alerts
ALTER TABLE public.user_email_preferences
ADD COLUMN IF NOT EXISTS employer_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS job_expiring_alerts boolean DEFAULT true;
