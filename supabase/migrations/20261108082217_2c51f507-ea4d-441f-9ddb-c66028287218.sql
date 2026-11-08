ALTER TABLE public.applications ADD COLUMN cv_path text, ADD COLUMN is_test boolean DEFAULT false;
ALTER TABLE public.hiring_settings ADD COLUMN google_login_enabled boolean DEFAULT false;
CREATE FUNCTION public.hiring_can_apply(_job_id uuid,_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.jobs WHERE id=_job_id AND ((status='draft' AND public.is_hiring_staff(_user_id)) OR (status='open' AND (deadline IS NULL OR deadline >= (now() AT TIME ZONE 'Asia/Dhaka')::date)))) $$;
REVOKE ALL ON FUNCTION public.hiring_can_apply(uuid,uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.hiring_can_apply(uuid,uuid) TO authenticated,service_role;
CREATE FUNCTION public.hiring_application_test_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF TG_OP='INSERT' THEN
  IF auth.uid() IS NOT NULL AND (NEW.candidate_id<>auth.uid() OR NOT public.hiring_can_apply(NEW.job_id,auth.uid())) THEN RAISE EXCEPTION 'This job is not accepting your application' USING ERRCODE='42501'; END IF;
  NEW.is_test:=public.is_hiring_staff(NEW.candidate_id) OR EXISTS(SELECT 1 FROM public.jobs WHERE id=NEW.job_id AND status='draft');
 ELSIF NEW.is_test IS DISTINCT FROM OLD.is_test THEN RAISE EXCEPTION 'Test label cannot be changed' USING ERRCODE='42501'; END IF;
 IF NEW.current_step NOT BETWEEN 1 AND 7 THEN RAISE EXCEPTION 'Invalid application step'; END IF;
 IF NEW.cv_path IS NOT NULL AND NEW.cv_path<>NEW.candidate_id::text||'/'||NEW.id::text||'/cv.pdf' THEN RAISE EXCEPTION 'Invalid CV path'; END IF;
 RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.hiring_application_test_guard() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER hiring_application_test BEFORE INSERT OR UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.hiring_application_test_guard();
CREATE FUNCTION public.hiring_current_template(_job_id uuid) RETURNS SETOF public.agreement_templates LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT t.* FROM public.agreement_templates t JOIN public.agreement_templates base ON t.name=base.name AND t.job_type=base.job_type JOIN public.jobs j ON j.agreement_template_id=base.id WHERE j.id=_job_id AND t.is_current ORDER BY t.version DESC LIMIT 1 $$;
REVOKE ALL ON FUNCTION public.hiring_current_template(uuid) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.hiring_reject_mutation() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF TG_TABLE_NAME='signed_agreements' AND TG_OP='UPDATE' AND auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.applications WHERE id=OLD.application_id AND candidate_id=auth.uid() AND is_draft) AND OLD.pdf_path='' AND NEW.application_id=OLD.application_id AND NEW.id=OLD.id THEN RETURN NEW; END IF;
 RAISE EXCEPTION 'Hiring history and submitted signed versions are immutable' USING ERRCODE='42501'; END $$;
CREATE OR REPLACE FUNCTION public.hiring_signed_agreement_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE a public.applications; t public.agreement_templates; BEGIN
 SELECT * INTO a FROM public.applications WHERE id=NEW.application_id FOR UPDATE;
 IF NOT FOUND OR NOT a.is_draft THEN RAISE EXCEPTION 'Agreement requires draft application'; END IF;
 SELECT * INTO t FROM public.hiring_current_template(a.job_id);
 IF NOT FOUND OR NEW.template_id<>t.id OR NEW.template_version<>t.version THEN RAISE EXCEPTION 'Current agreement version required'; END IF;
 IF btrim(NEW.signer_full_name)='' OR jsonb_typeof(NEW.accepted_terms)<>'array' OR NOT NEW.accepted_terms @> t.key_terms THEN RAISE EXCEPTION 'Accept every agreement term'; END IF;
 IF NEW.signature_path<>a.candidate_id::text||'/'||a.id::text||'/signature.png' OR (NEW.pdf_path<>'' AND NEW.pdf_path NOT LIKE a.candidate_id::text||'/'||a.id::text||'/%') THEN RAISE EXCEPTION 'Invalid agreement file path'; END IF;
 RETURN NEW; END $$;
CREATE FUNCTION public.record_signature(_application_id uuid,_signer_full_name text,_signature_path text,_accepted_terms jsonb,_user_agent text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE a public.applications; t public.agreement_templates; result uuid; ip inet; headers jsonb; BEGIN
 SELECT * INTO a FROM public.applications WHERE id=_application_id FOR UPDATE;
 IF auth.uid() IS NULL OR NOT FOUND OR a.candidate_id<>auth.uid() OR NOT a.is_draft THEN RAISE EXCEPTION 'Own draft required' USING ERRCODE='42501'; END IF;
 IF length(_signer_full_name)>100 OR lower(regexp_replace(btrim(_signer_full_name),'\s+',' ','g')) IS DISTINCT FROM (SELECT lower(regexp_replace(btrim(full_name),'\s+',' ','g')) FROM public.candidates WHERE id=auth.uid()) THEN RAISE EXCEPTION 'Signed name must match your full name'; END IF;
 SELECT * INTO t FROM public.hiring_current_template(a.job_id);
 IF NOT FOUND OR jsonb_typeof(_accepted_terms)<>'array' OR NOT _accepted_terms @> t.key_terms THEN RAISE EXCEPTION 'Accept every agreement term'; END IF;
 IF _signature_path<>auth.uid()::text||'/'||a.id::text||'/signature.png' OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='signatures' AND name=_signature_path) THEN RAISE EXCEPTION 'Upload your signature first'; END IF;
 headers:=coalesce(nullif(current_setting('request.headers',true),''),'{}')::jsonb;
 BEGIN ip:=nullif(btrim(split_part(headers->>'x-forwarded-for',',',1)),'')::inet; EXCEPTION WHEN invalid_text_representation THEN ip:=NULL; END;
 INSERT INTO public.signed_agreements(application_id,template_id,template_version,signer_full_name,signature_path,pdf_path,pdf_sha256,accepted_terms,user_agent,ip_address)
 VALUES(a.id,t.id,t.version,btrim(_signer_full_name),_signature_path,'',repeat('0',64),_accepted_terms,left(_user_agent,1000),ip)
 ON CONFLICT(application_id) DO UPDATE SET template_id=excluded.template_id,template_version=excluded.template_version,signer_full_name=excluded.signer_full_name,signature_path=excluded.signature_path,accepted_terms=excluded.accepted_terms,user_agent=excluded.user_agent,ip_address=excluded.ip_address,signed_at=now() RETURNING id INTO result;
 RETURN result; END $$;
REVOKE ALL ON FUNCTION public.record_signature(uuid,text,text,jsonb,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.record_signature(uuid,text,text,jsonb,text) TO authenticated,service_role;
CREATE FUNCTION public.submit_task(_application_id uuid,_url text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE a public.applications; BEGIN
 SELECT * INTO a FROM public.applications WHERE id=_application_id FOR UPDATE;
 IF auth.uid() IS NULL OR NOT FOUND OR a.candidate_id<>auth.uid() OR (NOT a.is_draft AND a.status_key<>'shortlisted') THEN RAISE EXCEPTION 'Own draft or shortlisted application required' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.jobs WHERE id=a.job_id AND task_enabled) THEN RAISE EXCEPTION 'Task not enabled'; END IF;
 IF _url IS NOT NULL AND (length(_url)>2048 OR _url !~ '^https?://[^[:space:]]+\.[^[:space:]]+') THEN RAISE EXCEPTION 'Enter a valid task URL'; END IF;
 IF NOT a.is_draft AND _url IS NULL THEN RAISE EXCEPTION 'Task URL required'; END IF;
 UPDATE public.applications SET task_submission_url=_url,task_submitted_at=CASE WHEN _url IS NULL THEN NULL ELSE now() END WHERE id=a.id;
 IF NOT a.is_draft THEN INSERT INTO public.application_events(application_id,from_status,to_status,message_to_candidate,created_by) VALUES(a.id,a.status_key,a.status_key,'Task submitted',auth.uid()); END IF;
 RETURN a.id; END $$;
REVOKE ALL ON FUNCTION public.submit_task(uuid,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.submit_task(uuid,text) TO authenticated,service_role;
CREATE FUNCTION public.hiring_validate_answer(_question_id uuid,_answer jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE q record; s text; BEGIN
 SELECT jq.*,qb.max_length INTO q FROM public.job_questions jq LEFT JOIN public.question_bank qb ON qb.id=jq.question_id WHERE jq.id=_question_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Question not found'; END IF;
 IF _answer IS NULL OR _answer IN ('null'::jsonb,'""'::jsonb,'[]'::jsonb) THEN RETURN; END IF;
 s:=_answer#>>'{}';
 IF q.type IN ('short_text','long_text','link','video_link') AND (jsonb_typeof(_answer)<>'string' OR length(s)>coalesce(q.max_length,CASE WHEN q.section='Practical task' THEN 500 WHEN q.type IN ('link','video_link') THEN 2048 ELSE 3000 END)) THEN RAISE EXCEPTION 'Answer is too long or has an invalid type'; END IF;
 IF q.type IN ('link','video_link') AND s !~ '^https?://[^[:space:]]+\.[^[:space:]]+' THEN RAISE EXCEPTION 'Enter a valid URL'; END IF;
 IF q.type='yes_no' AND _answer NOT IN ('"yes"'::jsonb,'"no"'::jsonb) THEN RAISE EXCEPTION 'Choose yes or no'; END IF;
 IF q.type='rating' AND _answer NOT IN ('1'::jsonb,'2'::jsonb,'3'::jsonb,'4'::jsonb,'5'::jsonb) THEN RAISE EXCEPTION 'Choose a rating from 1 to 5'; END IF;
 IF q.type='single_choice' AND NOT coalesce(q.options,'[]'::jsonb) @> jsonb_build_array(_answer) THEN RAISE EXCEPTION 'Invalid choice'; END IF;
 IF q.type='multi_choice' AND (jsonb_typeof(_answer)<>'array' OR NOT coalesce(q.options,'[]'::jsonb) @> _answer) THEN RAISE EXCEPTION 'Invalid choices'; END IF;
 END $$;
REVOKE ALL ON FUNCTION public.hiring_validate_answer(uuid,jsonb) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.hiring_answer_type_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN PERFORM public.hiring_validate_answer(NEW.job_question_id,NEW.answer); RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.hiring_answer_type_guard() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER hiring_answer_type BEFORE INSERT OR UPDATE ON public.application_answers FOR EACH ROW EXECUTE FUNCTION public.hiring_answer_type_guard();
INSERT INTO public.job_questions(job_id,label_override,type,required,section,sort_order) SELECT id,'How did you make it?','long_text',false,'Practical task',900 FROM public.jobs WHERE task_enabled;
CREATE FUNCTION public.hiring_save_progress(_job_id uuid,_step integer,_answers jsonb,_cv_path text DEFAULT NULL) RETURNS public.applications LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE a public.applications; item record; BEGIN
 IF auth.uid() IS NULL OR NOT public.hiring_can_apply(_job_id,auth.uid()) THEN RAISE EXCEPTION 'This job is not accepting your application' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.candidates WHERE id=auth.uid() AND coalesce(btrim(full_name),'')<>'' AND phone ~ '^(\+8801|01)[3-9][0-9]{8}$' AND coalesce(btrim(area),'')<>'' AND coalesce(btrim(education),'')<>'' AND coalesce(btrim(current_occupation),'')<>'') THEN RAISE EXCEPTION 'Complete your personal details first'; END IF;
 IF _step NOT BETWEEN 2 AND 7 OR jsonb_typeof(_answers)<>'object' THEN RAISE EXCEPTION 'Invalid progress'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('hiring-draft:'||auth.uid()::text||':'||_job_id::text,0));
 SELECT * INTO a FROM public.applications WHERE job_id=_job_id AND candidate_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN INSERT INTO public.applications(job_id,candidate_id,current_step) VALUES(_job_id,auth.uid(),_step) RETURNING * INTO a; END IF;
 IF NOT a.is_draft THEN RAISE EXCEPTION 'Application already submitted'; END IF;
 FOR item IN SELECT key,value FROM jsonb_each(_answers) LOOP
  IF NOT EXISTS(SELECT 1 FROM public.job_questions WHERE id=item.key::uuid AND job_id=_job_id) THEN RAISE EXCEPTION 'Question does not belong to job'; END IF;
  PERFORM public.hiring_validate_answer(item.key::uuid,item.value);
  INSERT INTO public.application_answers(application_id,job_question_id,answer) VALUES(a.id,item.key::uuid,item.value) ON CONFLICT(application_id,job_question_id) DO UPDATE SET answer=excluded.answer;
 END LOOP;
 UPDATE public.applications SET current_step=_step,cv_path=_cv_path WHERE id=a.id RETURNING * INTO a;
 RETURN a; END $$;
REVOKE ALL ON FUNCTION public.hiring_save_progress(uuid,integer,jsonb,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.hiring_save_progress(uuid,integer,jsonb,text) TO authenticated,service_role;
CREATE FUNCTION public.hiring_application_settings() RETURNS TABLE(google_login_enabled boolean) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT coalesce(google_login_enabled,false) FROM public.hiring_settings WHERE id=true $$;
REVOKE ALL ON FUNCTION public.hiring_application_settings() FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.hiring_application_settings() TO anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.submit_application(_application_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE a public.applications; j public.jobs; t public.agreement_templates; agreement public.signed_agreements; stage public.pipeline_stages; event_id uuid; flags jsonb; reviewer uuid; BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required' USING ERRCODE='42501'; END IF;
 SELECT * INTO a FROM public.applications WHERE id=_application_id FOR UPDATE;
 IF NOT FOUND OR a.candidate_id<>auth.uid() THEN RAISE EXCEPTION 'Application ownership required' USING ERRCODE='42501'; END IF;
 IF NOT a.is_draft THEN RAISE EXCEPTION 'Application already submitted'; END IF;
 SELECT * INTO j FROM public.jobs WHERE id=a.job_id;
 IF NOT public.hiring_can_apply(j.id,auth.uid()) THEN RAISE EXCEPTION 'Job is not accepting applications'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.candidates WHERE id=a.candidate_id AND phone ~ '^(\+8801|01)[3-9][0-9]{8}$' AND coalesce(btrim(full_name),'')<>'' AND coalesce(btrim(area),'')<>'' AND coalesce(btrim(education),'')<>'' AND coalesce(btrim(current_occupation),'')<>'') THEN RAISE EXCEPTION 'Complete your personal details'; END IF;
 IF EXISTS(SELECT 1 FROM public.job_questions q LEFT JOIN public.application_answers ans ON ans.job_question_id=q.id AND ans.application_id=a.id WHERE q.job_id=a.job_id AND q.required AND (ans.id IS NULL OR (q.type='file' AND coalesce(btrim(ans.file_url),'')='') OR (q.type<>'file' AND (ans.answer IS NULL OR ans.answer IN ('null'::jsonb,'""'::jsonb,'[]'::jsonb,'{}'::jsonb) OR (jsonb_typeof(ans.answer)='string' AND btrim(ans.answer#>>'{}')=''))))) THEN RAISE EXCEPTION 'All required answers must be completed'; END IF;
 SELECT * INTO t FROM public.hiring_current_template(j.id); SELECT * INTO agreement FROM public.signed_agreements WHERE application_id=a.id;
 IF agreement.id IS NULL OR agreement.template_id<>t.id OR agreement.template_version<>t.version OR NOT agreement.accepted_terms @> t.key_terms OR lower(regexp_replace(btrim(agreement.signer_full_name),'\s+',' ','g')) IS DISTINCT FROM (SELECT lower(regexp_replace(btrim(full_name),'\s+',' ','g')) FROM public.candidates WHERE id=a.candidate_id) THEN RAISE EXCEPTION 'Sign the current agreement again using your full name'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('question_id',q.id,'rule',coalesce(q.knockout_rule,b.knockout_rule),'answer',ans.answer)),'[]') INTO flags FROM public.job_questions q LEFT JOIN public.question_bank b ON b.id=q.question_id JOIN public.application_answers ans ON ans.job_question_id=q.id AND ans.application_id=a.id WHERE q.job_id=j.id AND coalesce(q.knockout_rule,b.knockout_rule) IS NOT NULL AND ((coalesce(q.knockout_rule,b.knockout_rule) ? 'equals' AND ans.answer=coalesce(q.knockout_rule,b.knockout_rule)->'equals') OR (coalesce(q.knockout_rule,b.knockout_rule) ? 'contains' AND ans.answer @> jsonb_build_array(coalesce(q.knockout_rule,b.knockout_rule)->'contains')));
 SELECT user_id INTO reviewer FROM public.hiring_user_roles WHERE role='admin' ORDER BY created_at,user_id LIMIT 1;
 IF reviewer IS NULL THEN SELECT user_id INTO reviewer FROM public.hiring_user_roles ORDER BY created_at,user_id LIMIT 1; END IF;
 IF flags<>'[]'::jsonb AND reviewer IS NULL THEN RAISE EXCEPTION 'Hiring reviewer must be configured'; END IF;
 IF reviewer IS NOT NULL THEN
  IF EXISTS(SELECT 1 FROM public.application_reviews WHERE application_id=a.id) THEN UPDATE public.application_reviews SET knockout_flags=flags WHERE application_id=a.id;
  ELSE INSERT INTO public.application_reviews(application_id,reviewer_id,knockout_flags) VALUES(a.id,reviewer,flags); END IF;
 END IF;
 SELECT s.* INTO stage FROM public.pipeline_stages s WHERE s.pipeline_id=j.application_pipeline_id ORDER BY s.sort_order,s.id LIMIT 1;
 IF NOT FOUND THEN RAISE EXCEPTION 'Application pipeline has no stages'; END IF;
 UPDATE public.applications SET is_draft=false,submitted_at=now(),status_key=stage.key WHERE id=a.id;
 INSERT INTO public.application_events(application_id,from_status,to_status,message_to_candidate,created_by) VALUES(a.id,'draft',stage.key,stage.candidate_label,auth.uid()) RETURNING id INTO event_id; RETURN event_id;
 END $$;
CREATE POLICY hiring_draft_file_replace ON storage.objects FOR UPDATE TO authenticated USING(bucket_id IN ('resumes','signatures','task-files') AND public.hiring_storage_path_owned(name) AND EXISTS(SELECT 1 FROM public.applications a WHERE a.id::text=split_part(name,'/',2) AND a.candidate_id=auth.uid() AND a.is_draft)) WITH CHECK(bucket_id IN ('resumes','signatures','task-files') AND public.hiring_storage_path_owned(name) AND EXISTS(SELECT 1 FROM public.applications a WHERE a.id::text=split_part(name,'/',2) AND a.candidate_id=auth.uid() AND a.is_draft));
CREATE POLICY hiring_draft_file_remove ON storage.objects FOR DELETE TO authenticated USING(bucket_id IN ('resumes','task-files') AND public.hiring_storage_path_owned(name) AND EXISTS(SELECT 1 FROM public.applications a WHERE a.id::text=split_part(name,'/',2) AND a.candidate_id=auth.uid() AND a.is_draft));