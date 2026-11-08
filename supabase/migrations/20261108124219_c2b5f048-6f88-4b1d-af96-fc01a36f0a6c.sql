CREATE FUNCTION public.hiring_save_job_filters(_job jsonb,_questions jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$ DECLARE saved uuid; BEGIN
saved := public.hiring_admin_save_job(_job,_questions);
UPDATE public.jobs SET experience_level=coalesce(_job->>'experience_level',experience_level), schedule=coalesce(_job->>'schedule',schedule) WHERE id=saved;
IF NOT FOUND THEN RAISE EXCEPTION 'Job filters could not be saved'; END IF;
RETURN saved;
END $$;
REVOKE ALL ON FUNCTION public.hiring_save_job_filters(jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.hiring_save_job_filters(jsonb,jsonb) TO authenticated,service_role;
DO $$ BEGIN
IF NOT EXISTS(SELECT 1 FROM public.jobs WHERE id='e2000000-0000-4000-8000-000000000001' AND experience_level='none' AND schedule='evening') THEN RAISE EXCEPTION 'Internship filter defaults missing'; END IF;
END $$;