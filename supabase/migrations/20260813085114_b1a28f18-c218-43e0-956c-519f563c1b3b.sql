INSERT INTO public.admin_settings (key, value, description)
VALUES
  ('resume_ai_enabled', 'true', 'Master switch for AI features in the resume builder'),
  ('resume_ai_summary_enabled', 'true', 'Allow AI professional summary generation'),
  ('resume_ai_skills_enabled', 'true', 'Allow AI skill suggestions'),
  ('resume_ai_experience_enabled', 'true', 'Allow AI work experience bullet generation'),
  ('resume_ai_cover_letter_enabled', 'true', 'Allow AI cover letter generation'),
  ('resume_ai_model', 'deepseek-chat', 'Model used for resume AI generation'),
  ('resume_ai_daily_limit', '20', 'Max AI resume generations per user per day (0 = unlimited)')
ON CONFLICT (key) DO NOTHING;

DROP POLICY IF EXISTS "Public can read resume AI settings" ON public.admin_settings;
CREATE POLICY "Public can read resume AI settings"
  ON public.admin_settings
  FOR SELECT
  USING (key LIKE 'resume_ai_%');