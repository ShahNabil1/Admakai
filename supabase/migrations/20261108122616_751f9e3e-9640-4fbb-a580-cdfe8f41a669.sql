ALTER TABLE public.applications ADD COLUMN passport_photo_path text;
ALTER TABLE public.job_questions ADD COLUMN retired boolean NOT NULL DEFAULT false;
CREATE FUNCTION public.hiring_passport_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF NEW.passport_photo_path IS NOT NULL AND NEW.passport_photo_path<>NEW.candidate_id::text||'/'||NEW.id::text||'/passport.jpg' THEN RAISE EXCEPTION 'Invalid passport photo path'; END IF;
 IF TG_OP='UPDATE' AND NEW.passport_photo_path IS DISTINCT FROM OLD.passport_photo_path AND NOT OLD.is_draft THEN RAISE EXCEPTION 'Submitted passport photo cannot change'; END IF;
 IF TG_OP='UPDATE' AND OLD.is_draft AND NOT NEW.is_draft AND NEW.job_id='e2000000-0000-4000-8000-000000000001'::uuid THEN
  IF NEW.passport_photo_path IS NULL OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='task-files' AND name=NEW.passport_photo_path) THEN RAISE EXCEPTION 'Upload your passport size photo before submitting'; END IF;
 END IF; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.hiring_passport_guard() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER hiring_passport_validation BEFORE INSERT OR UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.hiring_passport_guard();
CREATE OR REPLACE FUNCTION hiring_private.hiring_application_questions(_job_id uuid) RETURNS TABLE(id uuid,label text,type text,options jsonb,required boolean,section text,sort_order integer,max_length integer,help_text text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT q.id,coalesce(q.label_override,b.label,'Question'),q.type,coalesce(q.options,b.options),q.required,q.section,q.sort_order,coalesce(b.max_length,CASE WHEN q.section='Practical task' THEN 500 WHEN q.type IN ('link','video_link') THEN 2048 ELSE 3000 END),b.help_text FROM public.job_questions q LEFT JOIN public.question_bank b ON b.id=q.question_id WHERE q.job_id=_job_id AND NOT q.retired AND auth.uid() IS NOT NULL AND (public.hiring_can_apply(_job_id,auth.uid()) OR EXISTS(SELECT 1 FROM public.applications WHERE job_id=_job_id AND candidate_id=auth.uid())) ORDER BY q.sort_order $$;
DO $$ DECLARE target uuid:='e2000000-0000-4000-8000-000000000001'; item jsonb; bank uuid; BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.jobs WHERE id=target AND slug='ai-artist-intern') THEN RAISE EXCEPTION 'Expected internship not found'; END IF;
 UPDATE public.jobs SET task_enabled=false WHERE id=target;
 UPDATE public.job_questions SET retired=true,required=false,knockout_rule=NULL WHERE job_id=target;
 FOR item IN SELECT value FROM jsonb_array_elements('[
 {"section":"Commitment","label":"Can you commit to the full 6 month program?","type":"yes_no","required":true,"knockout":"no"},
 {"section":"Commitment","label":"Can you work 3 PM to 6 PM and 8 PM to 11 PM (Bangladesh time)?","type":"yes_no","required":true,"knockout":"no"},
 {"section":"Commitment","label":"Are you currently working with any agency or AI video studio?","type":"yes_no","required":true,"knockout":"yes"},
 {"section":"Commitment","label":"Where would you like to work from?","type":"single_choice","required":true,"options":["Office","Remote","Either is fine"]},
 {"section":"Commitment","label":"When can you start?","type":"single_choice","required":true,"options":["Right away","Within 2 weeks","Within a month"]},
 {"section":"Your setup","label":"Do you have a laptop or computer you can use every day?","type":"yes_no","required":true,"knockout":"no"},
 {"section":"Your setup","label":"How is your internet connection?","type":"single_choice","required":true,"options":["Broadband or Wi-Fi","Mobile data","Both"]},
 {"section":"About you as a creator","label":"Why do you want to learn AI filmmaking?","type":"long_text","required":true,"max":600},
 {"section":"About you as a creator","label":"Tell us about a video, ad, film or drama you watched recently that stayed with you. What did you like about it?","type":"long_text","required":true,"max":600},
 {"section":"About you as a creator","label":"If you could make a 30 second ad for any Bangladeshi brand, which brand would you pick, and what would the story be? Just the idea, in a few lines.","type":"long_text","required":true,"max":600},
 {"section":"About you as a creator","label":"When you want to learn something new, how do you usually go about it?","type":"long_text","required":true,"max":400},
 {"section":"About you as a creator","label":"Have you tried any AI tools yet?","type":"multi_choice","required":false,"options":["ChatGPT","Claude","Gemini","Midjourney","Higgsfield","Kling","Seedance","Runway","ElevenLabs","CapCut","Not yet, and that''s okay"]},
 {"section":"Your work","label":"Have you ever made anything creative? Photos, videos, reels, drawings, writing, music, designs, anything counts.","type":"long_text","required":false,"max":400},
 {"section":"Your work","label":"Link to anything you have made (optional, even a phone video is welcome)","type":"link","required":false,"max":2048},
 {"section":"Last thing","label":"How did you hear about this internship?","type":"single_choice","required":true,"options":["Facebook","Instagram","YouTube","LinkedIn","A friend","AI Shikhun","Other"]},
 {"section":"Last thing","label":"Anything else you want us to know?","type":"long_text","required":false,"max":400}
 ]'::jsonb) LOOP
 INSERT INTO public.question_bank(category,type,label,options,max_length,knockout_rule,is_active) VALUES('other',item->>'type',item->>'label',item->'options',(item->>'max')::integer,CASE WHEN item ? 'knockout' THEN jsonb_build_object('operator','equals','value',item->>'knockout','flag',item->>'label') ELSE NULL END,true) RETURNING id INTO bank;
 INSERT INTO public.job_questions(job_id,question_id,type,options,required,section,sort_order,knockout_rule) VALUES(target,bank,item->>'type',item->'options',(item->>'required')::boolean,item->>'section',(SELECT coalesce(max(sort_order),0)+1 FROM public.job_questions WHERE job_id=target AND NOT retired),CASE WHEN item ? 'knockout' THEN jsonb_build_object('operator','equals','value',item->>'knockout','flag',item->>'label') ELSE NULL END);
 END LOOP;
END $$;