CREATE SCHEMA IF NOT EXISTS site_private;
REVOKE ALL ON SCHEMA site_private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA site_private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION site_private.can_edit()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'owner')
    OR EXISTS (SELECT 1 FROM public.hiring_user_roles WHERE user_id = auth.uid() AND role = 'admin'::public.app_role))
$$;
REVOKE ALL ON FUNCTION site_private.can_edit() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION site_private.can_edit() TO authenticated, service_role;

ALTER POLICY site_categories_insert ON public.service_categories WITH CHECK (site_private.can_edit());
ALTER POLICY site_categories_update ON public.service_categories USING (site_private.can_edit()) WITH CHECK (site_private.can_edit());
ALTER POLICY site_categories_delete ON public.service_categories USING (site_private.can_edit());
ALTER POLICY site_services_read ON public.services USING (is_published OR site_private.can_edit());
ALTER POLICY site_services_insert ON public.services WITH CHECK (site_private.can_edit());
ALTER POLICY site_services_update ON public.services USING (site_private.can_edit()) WITH CHECK (site_private.can_edit());
ALTER POLICY site_plans_read ON public.plans USING (is_published OR site_private.can_edit());
ALTER POLICY site_plans_insert ON public.plans WITH CHECK (site_private.can_edit());
ALTER POLICY site_plans_update ON public.plans USING (site_private.can_edit()) WITH CHECK (site_private.can_edit());

CREATE OR REPLACE FUNCTION site_private.reorder(_kind text, _ids uuid[])
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE changed integer := 0; actor uuid := auth.uid();
BEGIN
  IF NOT site_private.can_edit() THEN RAISE EXCEPTION 'Only site content editors can reorder' USING ERRCODE = '42501'; END IF;
  IF _kind NOT IN ('services','plans','service_categories') OR _ids IS NULL OR cardinality(_ids) = 0 OR cardinality(_ids) > 500 THEN RAISE EXCEPTION 'Invalid reorder request'; END IF;
  PERFORM set_config('app.site_content_reorder', 'on', true);
  EXECUTE format('UPDATE public.%I t SET sort_order = x.ord FROM unnest($1) WITH ORDINALITY AS x(id, ord) WHERE t.id = x.id AND t.sort_order IS DISTINCT FROM x.ord', _kind) USING _ids;
  GET DIAGNOSTICS changed = ROW_COUNT;
  PERFORM set_config('app.site_content_reorder', 'off', true);
  IF actor IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = actor) THEN actor := NULL; END IF;
  IF changed > 0 THEN
    INSERT INTO public.activity(entity_type, entity_id, actor_id, verb, meta)
    VALUES (_kind, _ids[1], actor, 'reordered', jsonb_build_object('title', 'Display order', 'count', changed));
  END IF;
  RETURN changed;
END $$;
REVOKE ALL ON FUNCTION site_private.reorder(text, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION site_private.reorder(text, uuid[]) TO authenticated;

DROP FUNCTION public.site_content_reorder(text, uuid[]);
CREATE FUNCTION public.site_content_reorder(_kind text, _ids uuid[])
RETURNS integer LANGUAGE sql SECURITY INVOKER SET search_path TO 'public' AS $$ SELECT site_private.reorder(_kind, _ids) $$;
REVOKE ALL ON FUNCTION public.site_content_reorder(text, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.site_content_reorder(text, uuid[]) TO authenticated;

DROP FUNCTION public.can_edit_site_content();
CREATE FUNCTION public.can_edit_site_content()
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO 'public' AS $$ SELECT site_private.can_edit() $$;
REVOKE ALL ON FUNCTION public.can_edit_site_content() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_edit_site_content() TO authenticated;