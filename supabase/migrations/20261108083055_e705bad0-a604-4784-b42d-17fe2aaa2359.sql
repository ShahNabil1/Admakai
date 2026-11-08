CREATE OR REPLACE FUNCTION public.hiring_application_test_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 NEW.cv_path:=nullif(NEW.cv_path,'');
 IF TG_OP='INSERT' THEN
  IF auth.uid() IS NOT NULL AND (NEW.candidate_id<>auth.uid() OR NOT public.hiring_can_apply(NEW.job_id,auth.uid())) THEN RAISE EXCEPTION 'This job is not accepting your application' USING ERRCODE='42501'; END IF;
  NEW.is_test:=public.is_hiring_staff(NEW.candidate_id) OR EXISTS(SELECT 1 FROM public.jobs WHERE id=NEW.job_id AND status='draft');
 ELSIF NEW.is_test IS DISTINCT FROM OLD.is_test THEN RAISE EXCEPTION 'Test label cannot be changed' USING ERRCODE='42501'; END IF;
 IF NEW.current_step NOT BETWEEN 1 AND 7 THEN RAISE EXCEPTION 'Invalid application step'; END IF;
 IF NEW.cv_path IS NOT NULL AND NEW.cv_path<>NEW.candidate_id::text||'/'||NEW.id::text||'/cv.pdf' THEN RAISE EXCEPTION 'Invalid CV path'; END IF;
 RETURN NEW; END $$;
CREATE FUNCTION public.hiring_signature_update_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE t public.agreement_templates; a public.applications; BEGIN
 SELECT * INTO a FROM public.applications WHERE id=NEW.application_id FOR UPDATE;
 SELECT * INTO t FROM public.hiring_current_template(a.job_id);
 IF NOT a.is_draft OR a.candidate_id IS DISTINCT FROM auth.uid() OR NEW.template_id IS DISTINCT FROM t.id OR NEW.template_version IS DISTINCT FROM t.version OR NOT NEW.accepted_terms @> t.key_terms OR NEW.signature_path<>a.candidate_id::text||'/'||a.id::text||'/signature.png' OR NEW.pdf_path<>'' THEN RAISE EXCEPTION 'Own unfinished current agreement required'; END IF; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.hiring_signature_update_guard() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER hiring_signature_update BEFORE UPDATE ON public.signed_agreements FOR EACH ROW EXECUTE FUNCTION public.hiring_signature_update_guard();
CREATE OR REPLACE FUNCTION hiring_private.submit_task(_application_id uuid,_url text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE a public.applications; BEGIN
 _url:=nullif(btrim(_url),'');
 SELECT * INTO a FROM public.applications WHERE id=_application_id FOR UPDATE;
 IF auth.uid() IS NULL OR NOT FOUND OR a.candidate_id<>auth.uid() OR (NOT a.is_draft AND a.status_key<>'shortlisted') THEN RAISE EXCEPTION 'Own draft or shortlisted application required' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.jobs WHERE id=a.job_id AND task_enabled) THEN RAISE EXCEPTION 'Task not enabled'; END IF;
 IF _url IS NOT NULL AND (length(_url)>2048 OR _url !~ '^https?://[^[:space:]]+\.[^[:space:]]+') THEN RAISE EXCEPTION 'Enter a valid task URL'; END IF;
 IF NOT a.is_draft AND _url IS NULL THEN RAISE EXCEPTION 'Task URL required'; END IF;
 UPDATE public.applications SET task_submission_url=_url,task_submitted_at=CASE WHEN _url IS NULL THEN NULL ELSE now() END WHERE id=a.id;
 IF NOT a.is_draft THEN INSERT INTO public.application_events(application_id,from_status,to_status,message_to_candidate,created_by) VALUES(a.id,a.status_key,a.status_key,'Task submitted',auth.uid()); END IF; RETURN a.id; END $$;
CREATE FUNCTION hiring_private.hiring_application_agreement(_job_id uuid) RETURNS TABLE(id uuid,version integer,body text,key_terms jsonb) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT t.id,t.version,t.body,t.key_terms FROM public.hiring_current_template(_job_id) t WHERE auth.uid() IS NOT NULL AND (public.hiring_can_apply(_job_id,auth.uid()) OR EXISTS(SELECT 1 FROM public.applications WHERE job_id=_job_id AND candidate_id=auth.uid())) $$;
REVOKE ALL ON FUNCTION hiring_private.hiring_application_agreement(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION hiring_private.hiring_application_agreement(uuid) TO authenticated,service_role;
CREATE FUNCTION public.hiring_application_agreement(_job_id uuid) RETURNS TABLE(id uuid,version integer,body text,key_terms jsonb) LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$ SELECT * FROM hiring_private.hiring_application_agreement(_job_id) $$;
REVOKE ALL ON FUNCTION public.hiring_application_agreement(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.hiring_application_agreement(uuid) TO authenticated,service_role;