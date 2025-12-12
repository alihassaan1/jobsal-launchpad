-- Create table for AI agent API logging and analytics
CREATE TABLE public.ai_agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  agent_type text NOT NULL, -- 'deepseek' or 'lovable'
  content_type text NOT NULL, -- 'blog_post', 'job_description', 'social_post', 'resume', 'image', etc.
  prompt_tokens integer DEFAULT 0,
  completion_tokens integer DEFAULT 0,
  total_tokens integer DEFAULT 0,
  cost numeric(10, 6) DEFAULT 0, -- Cost in USD
  duration_ms integer DEFAULT 0,
  status text NOT NULL DEFAULT 'success', -- 'success' or 'failed'
  error_message text,
  content_url text,
  response_preview text, -- First 500 chars of response
  request_preview text, -- First 500 chars of request/prompt
  metadata jsonb DEFAULT '{}'::jsonb,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.ai_agent_logs ENABLE ROW LEVEL SECURITY;

-- Admins can manage all logs
CREATE POLICY "Admins can manage all AI agent logs"
ON public.ai_agent_logs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for common queries
CREATE INDEX idx_ai_agent_logs_created_at ON public.ai_agent_logs(created_at DESC);
CREATE INDEX idx_ai_agent_logs_agent_type ON public.ai_agent_logs(agent_type);
CREATE INDEX idx_ai_agent_logs_content_type ON public.ai_agent_logs(content_type);
CREATE INDEX idx_ai_agent_logs_status ON public.ai_agent_logs(status);

-- Create view for analytics aggregation
CREATE OR REPLACE VIEW public.ai_agent_analytics AS
SELECT 
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE status = 'success') as successful_calls,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_calls,
  SUM(total_tokens) as total_tokens,
  SUM(cost) as total_cost,
  AVG(duration_ms) as avg_duration_ms,
  AVG(cost) as avg_cost_per_call,
  CASE WHEN SUM(total_tokens) > 0 THEN SUM(cost) / SUM(total_tokens) * 1000 ELSE 0 END as cost_per_1k_tokens
FROM public.ai_agent_logs;