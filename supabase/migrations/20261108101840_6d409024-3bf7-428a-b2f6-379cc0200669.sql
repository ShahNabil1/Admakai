ALTER TABLE public.email_log DROP CONSTRAINT email_log_status_check;
ALTER TABLE public.email_log ADD CONSTRAINT email_log_status_check CHECK (status IN ('sent','failed','skipped'));
CREATE FUNCTION public.withdraw_application(_application_id uuid,_reason text DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE a public.applications; terminal boolean; e uuid; BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required' USING ERRCODE='42501'; END IF;
IF length(coalesce(_reason,''))>2000 THEN RAISE EXCEPTION 'Reason too long'; END IF;
SELECT * INTO a FROM public.applications WHERE id=_application_id FOR UPDATE;
IF NOT FOUND OR a.candidate_id<>auth.uid() THEN RAISE EXCEPTION 'Application ownership required' USING ERRCODE='42501'; END IF;
SELECT s.is_terminal INTO terminal FROM public.pipeline_stages s JOIN public.jobs j ON j.application_pipeline_id=s.pipeline_id WHERE j.id=a.job_id AND s.key=a.status_key;
IF a.is_draft OR coalesce(terminal,true) OR a.status_key='withdrawn' THEN RAISE EXCEPTION 'Only submitted nonterminal applications can be withdrawn'; END IF;
IF NOT EXISTS(SELECT 1 FROM public.pipeline_stages s JOIN public.jobs j ON j.application_pipeline_id=s.pipeline_id WHERE j.id=a.job_id AND s.key='withdrawn') THEN RAISE EXCEPTION 'Withdrawal stage unavailable'; END IF;
UPDATE public.applications SET status_key='withdrawn',withdrawn_at=now() WHERE id=a.id;
INSERT INTO public.application_events(application_id,from_status,to_status,message_to_candidate,reason,created_by,visible_to_candidate) VALUES(a.id,a.status_key,'withdrawn','You withdrew your application.',nullif(btrim(_reason),''),auth.uid(),true) RETURNING id INTO e; RETURN e; END $$;
REVOKE ALL ON FUNCTION public.withdraw_application(uuid,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.withdraw_application(uuid,text) TO authenticated;
CREATE FUNCTION public.hiring_pdf_only_update(_old public.signed_agreements,_new public.signed_agreements) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT auth.role()='service_role' AND (to_jsonb(_old)-'pdf_path'-'pdf_sha256')=(to_jsonb(_new)-'pdf_path'-'pdf_sha256') AND _new.pdf_sha256 ~ '^[a-f0-9]{64}$' AND EXISTS(SELECT 1 FROM public.applications a WHERE a.id=_old.application_id AND NOT a.is_draft AND _new.pdf_path=a.candidate_id::text||'/'||a.id::text||'/agreement-'||a.public_code||'.pdf') $$;
REVOKE ALL ON FUNCTION public.hiring_pdf_only_update(public.signed_agreements,public.signed_agreements) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.hiring_pdf_only_update(public.signed_agreements,public.signed_agreements) TO service_role;
CREATE OR REPLACE FUNCTION public.hiring_reject_mutation() RETURNS trigger LANGUAGE plpgsql SET search_path='public' AS $$ BEGIN
IF TG_TABLE_NAME='signed_agreements' AND TG_OP='UPDATE' THEN
 IF auth.role()='service_role' AND public.hiring_pdf_only_update(OLD,NEW) THEN RETURN NEW; END IF;
 IF auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.applications WHERE id=OLD.application_id AND candidate_id=auth.uid() AND is_draft) AND OLD.pdf_path='' AND NEW.application_id=OLD.application_id AND NEW.id=OLD.id THEN RETURN NEW; END IF;
END IF; RAISE EXCEPTION 'Hiring history and submitted signed versions are immutable' USING ERRCODE='42501'; END $$;
CREATE OR REPLACE FUNCTION public.hiring_signature_update_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $$ DECLARE t public.agreement_templates; a public.applications; BEGIN
IF auth.role()='service_role' AND public.hiring_pdf_only_update(OLD,NEW) THEN RETURN NEW; END IF;
SELECT * INTO a FROM public.applications WHERE id=NEW.application_id FOR UPDATE; SELECT * INTO t FROM public.hiring_current_template(a.job_id);
IF NOT a.is_draft OR a.candidate_id IS DISTINCT FROM auth.uid() OR NEW.template_id IS DISTINCT FROM t.id OR NEW.template_version IS DISTINCT FROM t.version OR NOT NEW.accepted_terms @> t.key_terms OR NEW.signature_path<>a.candidate_id::text||'/'||a.id::text||'/signature.png' OR NEW.pdf_path<>'' THEN RAISE EXCEPTION 'Own unfinished current agreement required'; END IF; RETURN NEW; END $$;
CREATE FUNCTION public.hiring_english_name_guard() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$ BEGIN
IF (TG_OP='INSERT' OR NEW.full_name IS DISTINCT FROM OLD.full_name) AND NEW.full_name<>'' AND NEW.full_name !~ '^[A-Za-z .''-]+$' THEN RAISE EXCEPTION 'Write your name in English, as on your NID'; END IF; RETURN NEW; END $$;
CREATE TRIGGER hiring_english_name_step5 BEFORE INSERT OR UPDATE ON public.candidates FOR EACH ROW EXECUTE FUNCTION public.hiring_english_name_guard();