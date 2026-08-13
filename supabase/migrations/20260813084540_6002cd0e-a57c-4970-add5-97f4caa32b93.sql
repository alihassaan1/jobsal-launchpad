GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_codes TO authenticated;
GRANT SELECT ON public.promo_codes TO anon;
GRANT ALL ON public.promo_codes TO service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='promo_code_uses') THEN
    EXECUTE 'GRANT SELECT, INSERT ON public.promo_code_uses TO authenticated';
    EXECUTE 'GRANT ALL ON public.promo_code_uses TO service_role';
  END IF;
END $$;