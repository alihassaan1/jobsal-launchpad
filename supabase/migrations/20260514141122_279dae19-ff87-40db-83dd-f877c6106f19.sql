
-- Auto-create a draft company whenever a user is granted the 'employer' role.
-- This guarantees employers always show up in the Companies list, regardless of
-- which UI path created the role (admin promotion, signup, manual SQL, etc.).

CREATE OR REPLACE FUNCTION public.handle_employer_role_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_full_name text;
  v_base_name text;
  v_slug text;
BEGIN
  IF NEW.role <> 'employer' THEN
    RETURN NEW;
  END IF;

  -- Skip if this user already owns a company
  IF EXISTS (SELECT 1 FROM public.companies WHERE owner_id = NEW.user_id) THEN
    RETURN NEW;
  END IF;

  SELECT email, full_name INTO v_email, v_full_name
  FROM public.profiles WHERE id = NEW.user_id;

  v_base_name := COALESCE(
    NULLIF(trim(v_full_name), ''),
    split_part(COALESCE(v_email, 'employer'), '@', 1)
  );

  v_slug := regexp_replace(lower(v_base_name), '[^a-z0-9]+', '-', 'g');
  v_slug := regexp_replace(v_slug, '(^-|-$)', '', 'g');
  IF v_slug = '' THEN v_slug := 'company'; END IF;
  v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);

  BEGIN
    INSERT INTO public.companies (name, slug, owner_id, email, is_verified)
    VALUES (v_base_name || ' (Draft)', v_slug, NEW.user_id, v_email, false);
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_employer_role_company failed for user %: %', NEW.user_id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_roles_employer_company ON public.user_roles;
CREATE TRIGGER user_roles_employer_company
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.handle_employer_role_company();

-- Backfill: create draft companies for any existing employers who don't have one
INSERT INTO public.companies (name, slug, owner_id, email, is_verified)
SELECT
  COALESCE(NULLIF(trim(p.full_name), ''), split_part(p.email, '@', 1)) || ' (Draft)',
  regexp_replace(lower(COALESCE(NULLIF(trim(p.full_name), ''), split_part(p.email, '@', 1))), '[^a-z0-9]+', '-', 'g')
    || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6),
  ur.user_id,
  p.email,
  false
FROM public.user_roles ur
JOIN public.profiles p ON p.id = ur.user_id
WHERE ur.role = 'employer'
  AND NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.owner_id = ur.user_id);
