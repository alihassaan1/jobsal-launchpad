-- Function to assign default role on user signup
CREATE OR REPLACE FUNCTION public.handle_user_role_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Assign default job_seeker role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'job_seeker');
  RETURN NEW;
END;
$$;

-- Trigger to assign role automatically after profile creation
CREATE TRIGGER on_user_role_assignment
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_role_assignment();