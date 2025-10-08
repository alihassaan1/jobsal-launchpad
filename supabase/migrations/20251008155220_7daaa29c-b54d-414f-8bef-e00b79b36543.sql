-- Create job_recommendations table for AI-powered job matching
CREATE TABLE IF NOT EXISTS public.job_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  ai_match_score NUMERIC CHECK (ai_match_score >= 0 AND ai_match_score <= 1),
  matched_on JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, job_id)
);

-- Enable RLS
ALTER TABLE public.job_recommendations ENABLE ROW LEVEL SECURITY;

-- Users can view their own recommendations
CREATE POLICY "Users can view their own recommendations"
  ON public.job_recommendations
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert/update recommendations
CREATE POLICY "Authenticated users can manage recommendations"
  ON public.job_recommendations
  FOR ALL
  USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX idx_job_recommendations_user_score 
  ON public.job_recommendations(user_id, ai_match_score DESC);

CREATE INDEX idx_job_recommendations_job 
  ON public.job_recommendations(job_id);

-- Add trigger for updated_at
CREATE TRIGGER update_job_recommendations_updated_at
  BEFORE UPDATE ON public.job_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Extend analytics tracking
COMMENT ON COLUMN public.analytics.event_type IS 
  'Event types: view, click, apply, ai_recommendation_clicked, ai_job_applied, ai_candidate_viewed';

-- Function to calculate simple text similarity (fallback if AI fails)
CREATE OR REPLACE FUNCTION public.calculate_text_similarity(text1 TEXT, text2 TEXT)
RETURNS NUMERIC AS $$
DECLARE
  words1 TEXT[];
  words2 TEXT[];
  common_words INTEGER;
  total_words INTEGER;
BEGIN
  -- Simple word-based similarity (Jaccard index)
  words1 := string_to_array(lower(text1), ' ');
  words2 := string_to_array(lower(text2), ' ');
  
  SELECT COUNT(DISTINCT w) INTO common_words
  FROM unnest(words1) w
  WHERE w = ANY(words2);
  
  SELECT COUNT(DISTINCT w) INTO total_words
  FROM (
    SELECT unnest(words1) AS w
    UNION
    SELECT unnest(words2) AS w
  ) combined;
  
  IF total_words = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN common_words::numeric / total_words::numeric;
END;
$$ LANGUAGE plpgsql;