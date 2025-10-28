-- Fix security vulnerabilities by adding search_path to functions

-- 1. Fix can_post_job function
CREATE OR REPLACE FUNCTION public.can_post_job(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_jobs_count INTEGER;
  job_limit INTEGER;
BEGIN
  -- Get current active jobs count
  SELECT COUNT(*) INTO current_jobs_count
  FROM public.jobs j
  JOIN public.companies c ON j.company_id = c.id
  WHERE c.owner_id = user_id AND j.is_active = true;
  
  -- Get job posting limit from subscription
  SELECT COALESCE(s.job_posts_limit, 1) INTO job_limit
  FROM public.subscriptions s
  WHERE s.user_id = user_id AND s.status = 'active'
  LIMIT 1;
  
  -- -1 means unlimited
  IF job_limit = -1 THEN
    RETURN true;
  END IF;
  
  RETURN current_jobs_count < job_limit;
END;
$function$;

-- 2. Fix increment_company_views function
CREATE OR REPLACE FUNCTION public.increment_company_views(company_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.companies
  SET views_count = views_count + 1
  WHERE slug = company_slug;
END;
$function$;

-- 3. Fix update_company_follower_count function
CREATE OR REPLACE FUNCTION public.update_company_follower_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.companies
    SET followers_count = followers_count + 1
    WHERE id = NEW.company_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.companies
    SET followers_count = followers_count - 1
    WHERE id = OLD.company_id;
  END IF;
  RETURN NULL;
END;
$function$;

-- 4. Fix update_application_viewed_at function
CREATE OR REPLACE FUNCTION public.update_application_viewed_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.status != 'applied' AND OLD.status = 'applied' AND NEW.viewed_at IS NULL THEN
    NEW.viewed_at = NOW();
  END IF;
  RETURN NEW;
END;
$function$;

-- 5. Fix calculate_text_similarity function
CREATE OR REPLACE FUNCTION public.calculate_text_similarity(text1 text, text2 text)
RETURNS numeric
LANGUAGE plpgsql
SET search_path = public
AS $function$
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
$function$;

-- 6. Fix increment_job_views function
CREATE OR REPLACE FUNCTION public.increment_job_views(job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.jobs
  SET views_count = views_count + 1
  WHERE id = job_id;
END;
$function$;

-- 7. Fix update_job_application_count function
CREATE OR REPLACE FUNCTION public.update_job_application_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.jobs
    SET applications_count = applications_count + 1
    WHERE id = NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.jobs
    SET applications_count = applications_count - 1
    WHERE id = OLD.job_id;
  END IF;
  RETURN NULL;
END;
$function$;