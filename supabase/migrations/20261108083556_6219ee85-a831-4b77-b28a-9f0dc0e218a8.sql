DO $$ DECLARE u uuid:=gen_random_uuid(); j uuid; a public.applications; BEGIN BEGIN
 INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES(u,'step3-resign-'||u::text||'@example.invalid','{}');
 INSERT INTO public.hiring_user_roles(user_id,role) VALUES(u,'reviewer');INSERT INTO public.candidates(id,full_name,phone,area,education,current_occupation) VALUES(u,'Test Name','01712345678','Dhaka','Graduate','Artist');
 SELECT id INTO j FROM public.jobs WHERE status='draft' AND type='internship' LIMIT 1;
 PERFORM set_config('request.jwt.claim.sub',u::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);SET LOCAL ROLE authenticated;
 a:=public.hiring_save_progress(j,6,'{}','');RESET ROLE;
 INSERT INTO public.signed_agreements(application_id,template_id,template_version,signer_full_name,signature_path,pdf_path,pdf_sha256,accepted_terms) SELECT a.id,t.id,t.version,'Test Name',u::text||'/'||a.id::text||'/signature.png','',repeat('0',64),t.key_terms FROM public.hiring_current_template(j) t;
 SET LOCAL ROLE authenticated;UPDATE public.candidates SET full_name='Other Name' WHERE id=u;UPDATE public.candidates SET full_name='Test Name' WHERE id=u;
 IF (SELECT signer_full_name FROM public.signed_agreements WHERE application_id=a.id)<>'[Signature invalidated]' THEN RAISE EXCEPTION 'Name reverted without resigning';END IF;
 RESET ROLE;
 INSERT INTO public.jobs(slug,title,type,work_mode,status,application_pipeline_id,agreement_template_id,task_enabled) SELECT 'step3-disabled-'||u::text,'Disabled task test',type,work_mode,'draft',application_pipeline_id,agreement_template_id,false FROM public.jobs WHERE id=j RETURNING id INTO j;
 SET LOCAL ROLE authenticated;a:=public.hiring_save_progress(j,5,'{}','');IF a.current_step<>6 THEN RAISE EXCEPTION 'Disabled task did not skip';END IF;RESET ROLE;
 RAISE EXCEPTION USING ERRCODE='ZX004',MESSAGE='Rollback assertions passed';EXCEPTION WHEN SQLSTATE 'ZX004' THEN RAISE NOTICE 'Name and skipped-task assertions passed; fixtures rolled back';END;END $$;