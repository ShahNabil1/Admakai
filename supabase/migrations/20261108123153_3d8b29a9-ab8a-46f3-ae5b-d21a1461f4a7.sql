CREATE OR REPLACE FUNCTION public.hiring_passport_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF NEW.passport_photo_path IS NOT NULL AND NEW.passport_photo_path<>NEW.candidate_id::text||'/'||NEW.id::text||'/passport.jpg' THEN RAISE EXCEPTION 'Invalid passport photo path'; END IF;
 IF TG_OP='UPDATE' AND NEW.passport_photo_path IS DISTINCT FROM OLD.passport_photo_path AND NOT OLD.is_draft THEN RAISE EXCEPTION 'Submitted passport photo cannot change'; END IF;
 IF TG_OP='UPDATE' AND OLD.is_draft AND NOT NEW.is_draft THEN
  IF NEW.passport_photo_path IS NULL OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='task-files' AND name=NEW.passport_photo_path) THEN RAISE EXCEPTION 'Upload your passport size photo before submitting'; END IF;
 END IF; RETURN NEW; END $$;
DO $$ DECLARE target uuid:='e2000000-0000-4000-8000-000000000001'; BEGIN
 IF (SELECT task_enabled FROM public.jobs WHERE id=target) THEN RAISE EXCEPTION 'Internship task must be disabled'; END IF;
 IF (SELECT count(*) FROM public.job_questions WHERE job_id=target AND NOT retired)<>16 THEN RAISE EXCEPTION 'Expected 16 beginner questions'; END IF;
 IF (SELECT count(*) FROM public.job_questions WHERE job_id=target AND NOT retired AND knockout_rule->>'equals'='no')<>3 THEN RAISE EXCEPTION 'Commitment, hours and computer must flag No'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.job_questions q JOIN public.question_bank b ON b.id=q.question_id WHERE q.job_id=target AND NOT q.retired AND b.label='Are you currently working with any agency or AI video studio?' AND q.knockout_rule->>'equals'='yes') THEN RAISE EXCEPTION 'Competing studio must flag Yes'; END IF;
 IF (SELECT count(*) FROM public.job_questions q JOIN public.question_bank b ON b.id=q.question_id WHERE q.job_id=target AND NOT q.retired AND b.max_length=600)<>3 THEN RAISE EXCEPTION 'Three creator questions need 600 characters'; END IF;
 IF EXISTS(SELECT 1 FROM public.job_questions WHERE job_id=target AND NOT retired AND section='Your work' AND required) THEN RAISE EXCEPTION 'Creative work must remain optional'; END IF;
END $$;