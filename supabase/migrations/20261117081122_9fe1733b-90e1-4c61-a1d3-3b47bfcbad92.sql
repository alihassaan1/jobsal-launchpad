CREATE OR REPLACE FUNCTION public.create_internal_cron_token(_task text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
BEGIN
  IF _task NOT IN ('scheduled-job-alerts', 'scheduled-email-reminders', 'paypal-subscription-sync') THEN
    RAISE EXCEPTION 'Unsupported scheduled task';
  END IF;
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  DELETE FROM public.internal_cron_tokens WHERE expires_at <= now();
  INSERT INTO public.internal_cron_tokens (task, token_hash, expires_at)
  VALUES (_task, encode(extensions.digest(v_token, 'sha256'), 'hex'), now() + interval '2 minutes');
  RETURN v_token;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.create_internal_cron_token(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_internal_cron_token(text) TO service_role;

CREATE OR REPLACE FUNCTION public.consume_internal_cron_token(_token text, _task text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.internal_cron_tokens
  WHERE token_hash = encode(extensions.digest(_token, 'sha256'), 'hex')
    AND task = _task
    AND expires_at > now();
  RETURN FOUND;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.consume_internal_cron_token(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_internal_cron_token(text, text) TO service_role;
