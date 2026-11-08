CREATE SCHEMA hiring_private;
REVOKE ALL ON SCHEMA hiring_private FROM PUBLIC,anon;
GRANT USAGE ON SCHEMA hiring_private TO authenticated,service_role;
CREATE FUNCTION hiring_private.own_interviews() RETURNS TABLE(id uuid,application_id uuid,scheduled_at timestamptz,duration_minutes int,mode text,meet_link text,office_address text,status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT i.id,i.application_id,i.scheduled_at,i.duration_minutes,i.mode,i.meet_link,i.office_address,i.status FROM public.interviews i JOIN public.applications a ON a.id=i.application_id WHERE auth.uid() IS NOT NULL AND a.candidate_id=auth.uid()
$$;
REVOKE ALL ON FUNCTION hiring_private.own_interviews() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION hiring_private.own_interviews() TO authenticated,service_role;
CREATE OR REPLACE VIEW public.candidate_interviews WITH(security_invoker=true,security_barrier=true) AS SELECT id,application_id,scheduled_at,duration_minutes,mode,meet_link,office_address,status FROM hiring_private.own_interviews();
REVOKE ALL ON public.candidate_interviews FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.candidate_interviews TO authenticated,service_role;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_class WHERE oid='public.candidate_interviews'::regclass AND 'security_invoker=true'=ANY(reloptions)) THEN RAISE EXCEPTION 'Interview view must be caller-rights'; END IF;
 IF has_function_privilege('anon','hiring_private.own_interviews()','EXECUTE') OR has_table_privilege('anon','public.candidate_interviews','SELECT') THEN RAISE EXCEPTION 'Anonymous interview access must be denied'; END IF;
 IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='candidate_interviews' AND column_name IN ('result_score','strengths','concerns','recommendation')) THEN RAISE EXCEPTION 'Sensitive interview projection'; END IF;
END $$;