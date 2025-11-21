-- Schedule automated blog post generation daily at 10:00 AM UTC
SELECT cron.schedule(
  'auto-generate-blog-post-daily',
  '0 10 * * *', -- Every day at 10:00 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://vbnrmpudzcxjfdytlgks.supabase.co/functions/v1/auto-generate-blog',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZibnJtcHVkemN4amZkeXRsZ2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDI3NTEsImV4cCI6MjA3NTQ3ODc1MX0.mE_xVN6bD2vwrEeifW__4vfQHv1qpRsm0mLGo4W-9BE"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);