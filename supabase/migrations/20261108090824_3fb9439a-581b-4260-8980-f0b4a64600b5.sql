DO $$ DECLARE u uuid=gen_random_uuid(); reviewer uuid=gen_random_uuid(); j uuid; dup uuid; bank uuid; template uuid; pipe uuid; journey uuid; questions jsonb; job jsonb; n int; oldhelp text; BEGIN
BEGIN
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES(u,'hiring-step4-'||u||'@example.invalid','{}'),(reviewer,'hiring-reviewer-'||reviewer||'@example.invalid','{}');
INSERT INTO public.hiring_user_roles(user_id,role) VALUES(u,'admin'),(reviewer,'reviewer');
SELECT id INTO pipe FROM public.pipelines WHERE kind='application' LIMIT 1; SELECT id INTO journey FROM public.pipelines WHERE kind='journey' LIMIT 1;
PERFORM set_config('request.jwt.claim.sub',u::text,true); PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true); SET LOCAL ROLE authenticated;
template=public.hiring_admin_agreement_version(jsonb_build_object('name','Step4 Test '||u,'job_type','internship','body','Hello {{candidate_name}}','key_terms',jsonb_build_array('Commit'),'legal_review_pending',true));
INSERT INTO public.question_bank(category,type,label,help_text,max_length) VALUES('thinking','short_text','Test question','Original help',100) RETURNING id INTO bank;
questions=jsonb_build_array(jsonb_build_object('label','Test question','help_text','Original help','max_length',100,'type','short_text','required',true,'section','Thinking','sort_order',0,'source_id',bank),jsonb_build_object('label','Rating question','type','rating','required',true,'section','Thinking','sort_order',1,'knockout_rule',jsonb_build_object('less_than',3)));
job=jsonb_build_object('title','Step4 Job','slug','step4-'||u,'type','internship','work_mode','hybrid','deadline',(current_date+7)::text,'application_pipeline_id',pipe,'journey_pipeline_id',journey,'agreement_template_id',template,'task_submission_type','link');
j=public.hiring_admin_save_job(job,questions); IF cardinality(public.hiring_job_publish_errors(j))<>0 THEN RAISE EXCEPTION 'Valid job failed publish'; END IF;
UPDATE public.jobs SET status='open' WHERE id=j; IF NOT EXISTS(SELECT 1 FROM public.jobs WHERE id=j AND status='open') THEN RAISE EXCEPTION 'Job not published'; END IF;
PERFORM public.hiring_admin_freeze_bank(bank); UPDATE public.question_bank SET help_text='Changed help' WHERE id=bank;
SELECT b.help_text INTO oldhelp FROM public.job_questions q JOIN public.question_bank b ON b.id=q.question_id WHERE q.job_id=j AND q.label_override='Test question'; IF oldhelp<>'Original help' THEN RAISE EXCEPTION 'Bank edit changed job'; END IF;
dup=public.hiring_admin_duplicate_job(j); IF NOT EXISTS(SELECT 1 FROM public.jobs WHERE id=dup AND title='Copy of Step4 Job' AND status='draft') OR (SELECT count(*) FROM public.job_questions WHERE job_id=dup)<>2 THEN RAISE EXCEPTION 'Duplicate failed'; END IF;
UPDATE public.jobs SET status='closed' WHERE id=j;
PERFORM set_config('request.jwt.claim.sub',reviewer::text,true); PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',reviewer,'role','authenticated')::text,true);
IF NOT EXISTS(SELECT 1 FROM public.jobs WHERE id=j) THEN RAISE EXCEPTION 'Reviewer cannot read job'; END IF;
SELECT count(*) INTO n FROM public.hiring_settings; IF n<>0 THEN RAISE EXCEPTION 'Reviewer sees settings'; END IF;
BEGIN PERFORM public.hiring_admin_duplicate_job(j); RAISE EXCEPTION 'Reviewer write allowed'; EXCEPTION WHEN OTHERS THEN IF SQLERRM='Reviewer write allowed' THEN RAISE; END IF; END;
RAISE EXCEPTION 'step4_rollback_success';
EXCEPTION WHEN OTHERS THEN RESET ROLE; IF SQLERRM <> 'step4_rollback_success' THEN RAISE; END IF; END;
END $$;