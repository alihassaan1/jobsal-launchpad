SELECT cron.alter_job(1, active := false);
SELECT cron.alter_job(2, active := false);
SELECT cron.alter_job(3, active := false);
SELECT cron.alter_job(4, active := false);
SELECT cron.alter_job(5, active := false);
CREATE OR REPLACE FUNCTION public.trigger_welcome_email() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.email_queue(user_id, template_slug, scheduled_for, status, metadata) VALUES(NEW.id, 'welcome', now(), 'pending', jsonb_build_object('name', coalesce(NEW.full_name, ''))); RETURN NEW; END; $$;
REVOKE EXECUTE ON FUNCTION public.trigger_welcome_email() FROM PUBLIC, anon, authenticated;