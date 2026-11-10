CREATE OR REPLACE FUNCTION public.can_view_profile(_profile_id uuid, _viewer uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _profile_id = _viewer
    OR public.has_role(_viewer, 'admin')
    -- employers see people who applied to their company's jobs
    OR EXISTS (
      SELECT 1 FROM applications a JOIN jobs j ON j.id = a.job_id
      JOIN companies c ON c.id = j.company_id
      WHERE a.applicant_id = _profile_id
        AND (c.owner_id = _viewer OR public.is_company_member(c.id, _viewer, 'viewer'))
    )
    -- teammates in the same company
    OR EXISTS (
      SELECT 1 FROM company_members m1 JOIN company_members m2 ON m1.company_id = m2.company_id
      WHERE m1.user_id = _profile_id AND m2.user_id = _viewer
    )
$$;
REVOKE ALL ON FUNCTION public.can_view_profile(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_profile(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_published_author(_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM posts WHERE author_id = _profile_id AND is_published = true)
$$;
GRANT EXECUTE ON FUNCTION public.is_published_author(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Profiles visible to owner, admins, related employers and teammates"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.can_view_profile(id, auth.uid()));
CREATE POLICY "Published blog author profiles are public"
  ON public.profiles FOR SELECT TO anon, authenticated
  USING (public.is_published_author(id));

DROP POLICY IF EXISTS "Users can view all followers" ON public.company_followers;
CREATE POLICY "Users see own follows; companies and admins see theirs"
  ON public.company_followers FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.owner_id = auth.uid())
    OR public.is_company_member(company_id, auth.uid(), 'viewer')
  );