-- Fix: Drop the SECURITY DEFINER view and recreate as a regular view
DROP VIEW IF EXISTS public.ai_agent_analytics;

-- Recreate as a simple aggregation function instead (safer approach)
CREATE OR REPLACE FUNCTION public.get_ai_agent_analytics()
RETURNS TABLE (
  total_calls bigint,
  successful_calls bigint,
  failed_calls bigint,
  total_tokens numeric,
  total_cost numeric,
  avg_duration_ms numeric,
  avg_cost_per_call numeric,
  cost_per_1k_tokens numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    COUNT(*)::bigint as total_calls,
    COUNT(*) FILTER (WHERE status = 'success')::bigint as successful_calls,
    COUNT(*) FILTER (WHERE status = 'failed')::bigint as failed_calls,
    COALESCE(SUM(total_tokens), 0)::numeric as total_tokens,
    COALESCE(SUM(cost), 0)::numeric as total_cost,
    COALESCE(AVG(duration_ms), 0)::numeric as avg_duration_ms,
    COALESCE(AVG(cost), 0)::numeric as avg_cost_per_call,
    CASE WHEN COALESCE(SUM(total_tokens), 0) > 0 
      THEN COALESCE(SUM(cost), 0) / SUM(total_tokens) * 1000 
      ELSE 0 
    END::numeric as cost_per_1k_tokens
  FROM public.ai_agent_logs;
$$;