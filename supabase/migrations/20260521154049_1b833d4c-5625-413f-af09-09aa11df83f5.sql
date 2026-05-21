CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id)
);
CREATE INDEX IF NOT EXISTS saved_jobs_user_idx ON public.saved_jobs(user_id);
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own saved jobs" ON public.saved_jobs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can save jobs" ON public.saved_jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave jobs" ON public.saved_jobs FOR DELETE TO authenticated USING (auth.uid() = user_id);