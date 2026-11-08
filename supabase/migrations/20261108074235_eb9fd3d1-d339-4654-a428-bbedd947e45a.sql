DO $test$
DECLARE ca uuid:='e3000000-0000-4000-8000-000000000001'; cb uuid:='e3000000-0000-4000-8000-000000000002'; interviewer uuid:='e3000000-0000-4000-8000-000000000003'; jid uuid:='e3000000-0000-4000-8000-000000000004'; aid uuid:='e3000000-0000-4000-8000-000000000005';
BEGIN
 BEGIN
 INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES(ca,'hiring-safe-view-a@example.invalid','{}'),(cb,'hiring-safe-view-b@example.invalid','{}'),(interviewer,'hiring-safe-view-interviewer@example.invalid','{}');
 INSERT INTO public.candidates(id,full_name) VALUES(ca,'Safe view candidate A'),(cb,'Safe view candidate B');
 INSERT INTO public.jobs(id,slug,title,type,work_mode,status,application_pipeline_id,agreement_template_id) VALUES(jid,'hiring-safe-view-test','Safe view test','internship','remote','open','e1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000003');
 INSERT INTO public.applications(id,job_id,candidate_id) VALUES(aid,jid,ca);
 INSERT INTO public.interviews(application_id,scheduled_at,mode,meet_link,interviewer_id,result_score,strengths,concerns,recommendation) VALUES(aid,now(),'meet','https://meet.google.com/regression-only',interviewer,5,'private','private','select');
 PERFORM set_config('request.jwt.claim.sub',ca::text,true); PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',ca,'role','authenticated')::text,true); SET LOCAL ROLE authenticated;
 IF (SELECT count(*) FROM public.candidate_interviews)<>1 THEN RAISE EXCEPTION 'Hardened view must expose the owned appointment'; END IF;
 IF EXISTS(SELECT 1 FROM public.interviews) THEN RAISE EXCEPTION 'Raw interview must remain invisible'; END IF;
 IF public.is_hiring_staff(ca) OR public.has_role(ca,'admin') THEN RAISE EXCEPTION 'Legacy client role became hiring staff'; END IF;
 RESET ROLE;
 PERFORM set_config('request.jwt.claim.sub',cb::text,true); PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',cb,'role','authenticated')::text,true); SET LOCAL ROLE authenticated;
 IF EXISTS(SELECT 1 FROM public.candidate_interviews) OR EXISTS(SELECT 1 FROM hiring_private.own_interviews()) THEN RAISE EXCEPTION 'Safe reader leaks another candidate interview'; END IF;
 RESET ROLE;
 PERFORM set_config('request.jwt.claim.sub','',true); PERFORM set_config('request.jwt.claims','{"role":"anon"}',true); SET LOCAL ROLE anon;
 BEGIN PERFORM 1 FROM public.candidate_interviews; RAISE EXCEPTION 'Anonymous safe interview access allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 RESET ROLE;
 RAISE EXCEPTION 'hiring_safe_view_test_rollback' USING ERRCODE='Z0001';
 EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL;
 END;
 IF EXISTS(SELECT 1 FROM auth.users WHERE id IN (ca,cb,interviewer)) THEN RAISE EXCEPTION 'Safe view regression users not rolled back'; END IF;
END $test$;