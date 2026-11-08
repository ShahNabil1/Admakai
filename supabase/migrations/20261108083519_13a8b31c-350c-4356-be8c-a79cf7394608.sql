CREATE POLICY hiring_signature_checked_insert ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(bucket_id<>'signatures');
CREATE POLICY hiring_signature_checked_replace ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated USING(bucket_id<>'signatures') WITH CHECK(bucket_id<>'signatures');
CREATE OR REPLACE FUNCTION public.hiring_signature_update_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE t public.agreement_templates; a public.applications; BEGIN
 SELECT * INTO a FROM public.applications WHERE id=NEW.application_id FOR UPDATE;
 SELECT * INTO t FROM public.hiring_current_template(a.job_id);
 IF NOT a.is_draft OR a.candidate_id IS DISTINCT FROM auth.uid() OR NEW.template_id IS DISTINCT FROM t.id OR NEW.template_version IS DISTINCT FROM t.version OR NOT NEW.accepted_terms @> t.key_terms OR NEW.signature_path<>a.candidate_id::text||'/'||a.id::text||'/signature.png' OR NEW.pdf_path<>'' THEN RAISE EXCEPTION 'Own unfinished current agreement required'; END IF; RETURN NEW; END $$;
CREATE FUNCTION public.hiring_name_resign() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF lower(regexp_replace(btrim(NEW.full_name),'\s+',' ','g')) IS DISTINCT FROM lower(regexp_replace(btrim(OLD.full_name),'\s+',' ','g')) THEN
 UPDATE public.signed_agreements s SET signer_full_name='[Signature invalidated]' FROM public.applications a WHERE s.application_id=a.id AND a.candidate_id=NEW.id AND a.is_draft AND s.pdf_path='';
 END IF; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.hiring_name_resign() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER hiring_name_requires_resign AFTER UPDATE OF full_name ON public.candidates FOR EACH ROW EXECUTE FUNCTION public.hiring_name_resign();
CREATE FUNCTION public.hiring_normalize_task_step() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN IF NEW.current_step=5 AND EXISTS(SELECT 1 FROM public.jobs WHERE id=NEW.job_id AND NOT task_enabled) THEN NEW.current_step:=6;END IF;RETURN NEW;END $$;
REVOKE ALL ON FUNCTION public.hiring_normalize_task_step() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER hiring_task_step BEFORE INSERT OR UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.hiring_normalize_task_step();