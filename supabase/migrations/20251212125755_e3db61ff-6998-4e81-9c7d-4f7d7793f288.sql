-- Enable required extensions for cron scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule the AI content generator to run daily at 8 AM Albania time (6 AM UTC)
SELECT cron.schedule(
  'daily-ai-content-generation',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vbnrmpudzcxjfdytlgks.supabase.co/functions/v1/scheduled-ai-content',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZibnJtcHVkemN4amZkeXRsZ2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDI3NTEsImV4cCI6MjA3NTQ3ODc1MX0.mE_xVN6bD2vwrEeifW__4vfQHv1qpRsm0mLGo4W-9BE"}'::jsonb,
    body := '{"trigger": "scheduled"}'::jsonb
  ) AS request_id;
  $$
);