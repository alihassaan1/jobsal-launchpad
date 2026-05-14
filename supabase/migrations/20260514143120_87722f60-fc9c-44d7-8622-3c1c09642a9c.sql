CREATE OR REPLACE FUNCTION public.handle_user_role_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_type text;
  v_role public.app_role;
BEGIN
  SELECT lower(coalesce(
    raw_user_meta_data->>'account_type',
    raw_user_meta_data->>'role',
    raw_user_meta_data->>'user_role',
    ''
  ))
  INTO v_account_type
  FROM auth.users
  WHERE id = NEW.id;

  IF v_account_type = 'employer' THEN
    v_role := 'employer'::public.app_role;
  ELSE
    v_role := 'job_seeker'::public.app_role;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.become_employer()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'employer'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.become_employer() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.become_employer() TO authenticated;