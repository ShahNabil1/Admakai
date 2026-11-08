ALTER TABLE public.hiring_settings ADD COLUMN whatsapp_help_url text;
CREATE TABLE public.hiring_question_sources (job_question_id uuid PRIMARY KEY REFERENCES public.job_questions(id) ON DELETE CASCADE, bank_question_id uuid NOT NULL REFERENCES public.question_bank(id), created_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.hiring_question_sources FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.hiring_question_sources TO authenticated; GRANT ALL ON public.hiring_question_sources TO service_role;
ALTER TABLE public.hiring_question_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY hiring_sources_read ON public.hiring_question_sources FOR SELECT TO authenticated USING(public.is_hiring_staff(auth.uid()));
CREATE POLICY hiring_sources_admin ON public.hiring_question_sources FOR ALL TO authenticated USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));
CREATE TABLE public.hiring_agreement_reviews (template_id uuid PRIMARY KEY REFERENCES public.agreement_templates(id), legal_review_pending boolean NOT NULL DEFAULT true, updated_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.hiring_agreement_reviews FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.hiring_agreement_reviews TO authenticated; GRANT ALL ON public.hiring_agreement_reviews TO service_role;
ALTER TABLE public.hiring_agreement_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY hiring_agreement_reviews_admin ON public.hiring_agreement_reviews FOR ALL TO authenticated USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));
CREATE POLICY hiring_settings_admin_only_step4 ON public.hiring_settings AS RESTRICTIVE FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE POLICY hiring_step4_asset_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id IN ('hiring-assets','hiring-public') AND public.has_role(auth.uid(),'admin'));
CREATE POLICY hiring_step4_asset_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id IN ('hiring-assets','hiring-public') AND public.has_role(auth.uid(),'admin'));
CREATE POLICY hiring_step4_asset_update ON storage.objects FOR UPDATE TO authenticated USING(bucket_id IN ('hiring-assets','hiring-public') AND public.has_role(auth.uid(),'admin')) WITH CHECK(bucket_id IN ('hiring-assets','hiring-public') AND public.has_role(auth.uid(),'admin'));
CREATE POLICY hiring_step4_asset_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id IN ('hiring-assets','hiring-public') AND public.has_role(auth.uid(),'admin'));
CREATE FUNCTION public.hiring_public_help() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT whatsapp_help_url FROM public.hiring_settings WHERE id=true $$;
REVOKE ALL ON FUNCTION public.hiring_public_help() FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.hiring_public_help() TO anon,authenticated,service_role;
CREATE FUNCTION public.hiring_job_publish_errors(_job_id uuid) RETURNS text[] LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ DECLARE j public.jobs; e text[]='{}'; BEGIN
IF NOT public.is_hiring_staff(auth.uid()) THEN RAISE EXCEPTION 'Forbidden'; END IF;
SELECT * INTO j FROM public.jobs WHERE id=_job_id; IF NOT FOUND THEN RAISE EXCEPTION 'Job not found'; END IF;
IF btrim(j.title)='' THEN e=array_append(e,'Title'); END IF;
IF btrim(j.slug)='' OR EXISTS(SELECT 1 FROM public.jobs WHERE slug=j.slug AND id<>j.id) THEN e=array_append(e,'Unique slug'); END IF;
IF j.deadline IS NULL OR j.deadline <= (now() AT TIME ZONE 'Asia/Dhaka')::date THEN e=array_append(e,'Deadline in the future'); END IF;
IF NOT EXISTS(SELECT 1 FROM public.job_questions WHERE job_id=j.id) THEN e=array_append(e,'At least one question'); END IF;
IF j.agreement_template_id IS NULL THEN e=array_append(e,'Agreement template'); END IF;
IF j.application_pipeline_id IS NULL THEN e=array_append(e,'Application pipeline'); END IF;
IF j.journey_pipeline_id IS NULL THEN e=array_append(e,'Journey pipeline'); END IF;
RETURN e; END $$;
CREATE FUNCTION public.hiring_publish_guard_step4() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ DECLARE e text[]; BEGIN IF NEW.status='open' THEN
IF btrim(NEW.title)='' OR btrim(NEW.slug)='' OR NEW.deadline IS NULL OR NEW.deadline <= (now() AT TIME ZONE 'Asia/Dhaka')::date OR NEW.agreement_template_id IS NULL OR NEW.journey_pipeline_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.job_questions WHERE job_id=NEW.id) THEN RAISE EXCEPTION 'Publish requires title, unique slug, future deadline, question, agreement and both pipelines'; END IF;
END IF; RETURN NEW; END $$;
CREATE TRIGGER hiring_publish_step4 BEFORE INSERT OR UPDATE OF status ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.hiring_publish_guard_step4();
CREATE FUNCTION public.hiring_admin_save_job(_job jsonb,_questions jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE j public.jobs; q jsonb; qid uuid; bid uuid; sourceid uuid; kept uuid[]='{}'; BEGIN
IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
j=jsonb_populate_record(NULL::public.jobs,_job); IF j.id IS NULL THEN j.id=gen_random_uuid(); END IF;
IF j.application_pipeline_id IS NULL THEN SELECT id INTO j.application_pipeline_id FROM public.pipelines WHERE kind='application' ORDER BY is_default DESC LIMIT 1; END IF;
INSERT INTO public.jobs(id,title,slug,type,work_mode,schedule_text,seats,deadline,summary,description,responsibilities,requirements,nice_to_have,benefits,tools,cover_image_url,application_pipeline_id,journey_pipeline_id,agreement_template_id,task_enabled,task_brief,task_due_days,task_submission_type,created_by,status)
VALUES(j.id,coalesce(j.title,''),coalesce(j.slug,'draft-'||j.id),coalesce(j.type,'internship'),coalesce(j.work_mode,'hybrid'),j.schedule_text,j.seats,j.deadline,j.summary,j.description,coalesce(j.responsibilities,'{}'),coalesce(j.requirements,'{}'),coalesce(j.nice_to_have,'{}'),coalesce(j.benefits,'{}'),coalesce(j.tools,'{}'),j.cover_image_url,j.application_pipeline_id,j.journey_pipeline_id,j.agreement_template_id,coalesce(j.task_enabled,false),j.task_brief,j.task_due_days,coalesce(j.task_submission_type,'link'),auth.uid(),'draft')
ON CONFLICT(id) DO UPDATE SET title=excluded.title,slug=excluded.slug,type=excluded.type,work_mode=excluded.work_mode,schedule_text=excluded.schedule_text,seats=excluded.seats,deadline=excluded.deadline,summary=excluded.summary,description=excluded.description,responsibilities=excluded.responsibilities,requirements=excluded.requirements,nice_to_have=excluded.nice_to_have,benefits=excluded.benefits,tools=excluded.tools,cover_image_url=excluded.cover_image_url,application_pipeline_id=excluded.application_pipeline_id,journey_pipeline_id=excluded.journey_pipeline_id,agreement_template_id=excluded.agreement_template_id,task_enabled=excluded.task_enabled,task_brief=excluded.task_brief,task_due_days=excluded.task_due_days,task_submission_type=excluded.task_submission_type;
FOR q IN SELECT value FROM jsonb_array_elements(_questions) LOOP
qid=coalesce(nullif(q->>'id','')::uuid,gen_random_uuid()); IF EXISTS(SELECT 1 FROM public.job_questions WHERE id=qid AND job_id<>j.id) THEN RAISE EXCEPTION 'Invalid question'; END IF;
sourceid=nullif(q->>'source_id','')::uuid;
INSERT INTO public.question_bank(category,type,label,help_text,options,max_length,knockout_rule,is_active) VALUES('__job_snapshot',q->>'type',q->>'label',q->>'help_text',q->'options',nullif(q->>'max_length','')::int,q->'knockout_rule',false) RETURNING id INTO bid;
INSERT INTO public.job_questions(id,job_id,question_id,label_override,type,options,required,section,sort_order,knockout_rule) VALUES(qid,j.id,bid,q->>'label',q->>'type',q->'options',coalesce((q->>'required')::bool,false),q->>'section',coalesce((q->>'sort_order')::int,0),q->'knockout_rule') ON CONFLICT(id) DO UPDATE SET question_id=excluded.question_id,label_override=excluded.label_override,type=excluded.type,options=excluded.options,required=excluded.required,section=excluded.section,sort_order=excluded.sort_order,knockout_rule=excluded.knockout_rule;
IF sourceid IS NOT NULL THEN INSERT INTO public.hiring_question_sources(job_question_id,bank_question_id) VALUES(qid,sourceid) ON CONFLICT(job_question_id) DO UPDATE SET bank_question_id=excluded.bank_question_id; END IF;
kept=array_append(kept,qid);
END LOOP;
DELETE FROM public.job_questions WHERE job_id=j.id AND NOT(id=ANY(kept)) AND NOT EXISTS(SELECT 1 FROM public.application_answers WHERE job_question_id=public.job_questions.id);
RETURN j.id; END $$;
CREATE FUNCTION public.hiring_admin_duplicate_job(_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE j public.jobs; q jsonb; result uuid; BEGIN
IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF; SELECT * INTO j FROM public.jobs WHERE id=_id; IF NOT FOUND THEN RAISE EXCEPTION 'Job not found'; END IF;
j.id=gen_random_uuid(); j.title='Copy of '||j.title; j.slug=j.slug||'-copy-'||substr(j.id::text,1,8); j.status='draft';
SELECT coalesce(jsonb_agg(jsonb_build_object('label',coalesce(jq.label_override,b.label),'type',jq.type,'options',jq.options,'required',jq.required,'section',jq.section,'sort_order',jq.sort_order,'knockout_rule',jq.knockout_rule,'help_text',b.help_text,'max_length',b.max_length,'source_id',coalesce(s.bank_question_id,CASE WHEN b.category<>'__job_snapshot' THEN b.id END)) ORDER BY jq.sort_order),'[]'::jsonb) INTO q FROM public.job_questions jq LEFT JOIN public.question_bank b ON b.id=jq.question_id LEFT JOIN public.hiring_question_sources s ON s.job_question_id=jq.id WHERE jq.job_id=_id;
result=public.hiring_admin_save_job(to_jsonb(j),q); RETURN result; END $$;
CREATE FUNCTION public.hiring_admin_update_drafts(_bank_id uuid) RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE b public.question_bank; r record; snapshot uuid; n int=0; BEGIN
IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF; SELECT * INTO b FROM public.question_bank WHERE id=_bank_id;
FOR r IN SELECT jq.id FROM public.job_questions jq JOIN public.jobs j ON j.id=jq.job_id LEFT JOIN public.hiring_question_sources s ON s.job_question_id=jq.id WHERE j.status='draft' AND coalesce(s.bank_question_id,jq.question_id)=_bank_id LOOP
INSERT INTO public.question_bank(category,type,label,help_text,options,max_length,knockout_rule,is_active) VALUES('__job_snapshot',b.type,b.label,b.help_text,b.options,b.max_length,b.knockout_rule,false) RETURNING id INTO snapshot;
UPDATE public.job_questions SET question_id=snapshot,label_override=b.label,type=b.type,options=b.options,knockout_rule=b.knockout_rule WHERE id=r.id;
INSERT INTO public.hiring_question_sources VALUES(r.id,_bank_id,now()) ON CONFLICT(job_question_id) DO UPDATE SET bank_question_id=excluded.bank_question_id; n=n+1;
END LOOP; RETURN n; END $$;
CREATE FUNCTION public.hiring_admin_agreement_version(_template jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE result uuid; v int; BEGIN
IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
PERFORM pg_advisory_xact_lock(hashtext((_template->>'name')||(_template->>'job_type')));
SELECT coalesce(max(version),0)+1 INTO v FROM public.agreement_templates WHERE name=_template->>'name' AND job_type=_template->>'job_type';
INSERT INTO public.agreement_templates(name,job_type,version,body,key_terms,is_current) VALUES(_template->>'name',_template->>'job_type',v,_template->>'body',_template->'key_terms',true) RETURNING id INTO result;
INSERT INTO public.hiring_agreement_reviews(template_id,legal_review_pending) VALUES(result,coalesce((_template->>'legal_review_pending')::bool,true)); RETURN result; END $$;
REVOKE ALL ON FUNCTION public.hiring_job_publish_errors(uuid),public.hiring_admin_save_job(jsonb,jsonb),public.hiring_admin_duplicate_job(uuid),public.hiring_admin_update_drafts(uuid),public.hiring_admin_agreement_version(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hiring_job_publish_errors(uuid),public.hiring_admin_save_job(jsonb,jsonb),public.hiring_admin_duplicate_job(uuid),public.hiring_admin_update_drafts(uuid),public.hiring_admin_agreement_version(jsonb) TO authenticated,service_role;
