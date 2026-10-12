CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.indexnow_ping(_path text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _path IS NULL OR _path = '' THEN RETURN; END IF;
  PERFORM net.http_post(
    url := 'https://api.indexnow.org/indexnow',
    headers := '{"Content-Type":"application/json; charset=utf-8"}'::jsonb,
    body := jsonb_build_object(
      'host', 'jobs.al',
      'key', 'ae69c2bfc62b455f9c9f1835b5ac084f',
      'keyLocation', 'https://jobs.al/ae69c2bfc62b455f9c9f1835b5ac084f.txt',
      'urlList', jsonb_build_array('https://jobs.al' || _path)
    )
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'IndexNow ping failed for %: %', _path, SQLERRM;
END;
$$;

REVOKE ALL ON FUNCTION public.indexnow_ping(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.indexnow_on_job()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.is_active AND (TG_OP = 'INSERT' OR NOT COALESCE(OLD.is_active,false) OR NEW.slug IS DISTINCT FROM OLD.slug) THEN
    PERFORM public.indexnow_ping('/jobs/' || NEW.slug);
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.indexnow_on_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.is_published AND (TG_OP = 'INSERT' OR NOT COALESCE(OLD.is_published,false) OR NEW.slug IS DISTINCT FROM OLD.slug) THEN
    PERFORM public.indexnow_ping('/blog/' || NEW.slug);
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.indexnow_on_company()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.slug IS DISTINCT FROM OLD.slug THEN
    PERFORM public.indexnow_ping('/companies/' || NEW.slug);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS indexnow_jobs ON public.jobs;
CREATE TRIGGER indexnow_jobs AFTER INSERT OR UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.indexnow_on_job();
DROP TRIGGER IF EXISTS indexnow_posts ON public.posts;
CREATE TRIGGER indexnow_posts AFTER INSERT OR UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.indexnow_on_post();
DROP TRIGGER IF EXISTS indexnow_companies ON public.companies;
CREATE TRIGGER indexnow_companies AFTER INSERT OR UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.indexnow_on_company();