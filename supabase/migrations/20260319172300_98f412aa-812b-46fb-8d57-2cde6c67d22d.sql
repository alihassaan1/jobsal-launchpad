-- Schedule daily job alerts at 8:00 AM UTC
SELECT cron.schedule(
  'daily-job-alerts',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url:='https://vbnrmpudzcxjfdytlgks.supabase.co/functions/v1/scheduled-job-alerts',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZibnJtcHVkemN4amZkeXRsZ2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDI3NTEsImV4cCI6MjA3NTQ3ODc1MX0.mE_xVN6bD2vwrEeifW__4vfQHv1qpRsm0mLGo4W-9BE"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);

-- Schedule daily email reminders at 9:00 AM UTC
SELECT cron.schedule(
  'daily-email-reminders',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url:='https://vbnrmpudzcxjfdytlgks.supabase.co/functions/v1/scheduled-email-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZibnJtcHVkemN4amZkeXRsZ2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDI3NTEsImV4cCI6MjA3NTQ3ODc1MX0.mE_xVN6bD2vwrEeifW__4vfQHv1qpRsm0mLGo4W-9BE"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);