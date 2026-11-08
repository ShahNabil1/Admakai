CREATE TABLE public.talent_pool (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), full_name text NOT NULL, email text NOT NULL, phone text, portfolio_url text, interested_in text[] NOT NULL DEFAULT '{}', message text, created_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.talent_pool FROM anon,authenticated;
GRANT INSERT ON public.talent_pool TO anon,authenticated;
GRANT SELECT ON public.talent_pool TO authenticated;
GRANT ALL ON public.talent_pool TO service_role;
ALTER TABLE public.talent_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY talent_pool_public_insert ON public.talent_pool FOR INSERT TO anon,authenticated WITH CHECK (true);
CREATE POLICY talent_pool_hiring_read ON public.talent_pool FOR SELECT TO authenticated USING (public.is_hiring_staff(auth.uid()));
CREATE FUNCTION public.hiring_talent_pool_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 NEW.email:=lower(btrim(NEW.email)); NEW.full_name:=btrim(NEW.full_name); NEW.created_at:=now();
 IF length(NEW.full_name)<2 OR length(NEW.full_name)>150 OR length(NEW.email)>254 OR NEW.email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR length(coalesce(NEW.phone,''))>40 OR length(coalesce(NEW.message,''))>3000 OR length(coalesce(NEW.portfolio_url,''))>1000 OR (coalesce(NEW.portfolio_url,'')<>'' AND NEW.portfolio_url !~ '^https?://') OR NOT NEW.interested_in <@ ARRAY['AI Video','Editing','Prompt Engineering','Sound and Music','Other']::text[] THEN RAISE EXCEPTION 'Invalid talent pool details' USING ERRCODE='23514'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('talent-pool:'||NEW.email,0));
 IF EXISTS(SELECT 1 FROM public.talent_pool WHERE email=NEW.email AND created_at>now()-interval '24 hours') THEN RAISE EXCEPTION 'talent_pool_daily_limit' USING ERRCODE='23505'; END IF; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.hiring_talent_pool_guard() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER talent_pool_guard BEFORE INSERT ON public.talent_pool FOR EACH ROW EXECUTE FUNCTION public.hiring_talent_pool_guard();
CREATE INDEX talent_pool_email_created_idx ON public.talent_pool(email,created_at);
INSERT INTO public.hiring_user_roles(user_id,role) SELECT user_id,'admin'::public.app_role FROM public.user_roles WHERE role::text='admin' ON CONFLICT(user_id,role) DO NOTHING;
INSERT INTO public.jobs(id,title,slug,status,type,work_mode,schedule_text,seats,deadline,summary,responsibilities,requirements,nice_to_have,benefits,tools,application_pipeline_id,journey_pipeline_id,agreement_template_id,task_enabled,task_due_days,task_submission_type,task_brief) VALUES
('e2000000-0000-4000-8000-000000000001','AI Video Artist Intern','ai-video-artist-intern','draft','internship','hybrid','3 PM to 6 PM and 8 PM to 11 PM',10,'2026-12-08','Learn filmmaking-minded AI video beside the Admakai team, then grow into paid projects and a salaried role.',
ARRAY['Create AI video shots and scenes for in-house and client projects','Write and refine prompts for image, video and voice tools','Edit, colour and polish AI footage to a cinematic standard','Take feedback from the creative director and improve fast','Share your process with the team'],
ARRAY['A portfolio or sample of any video or AI work','Basic editing skills in any editor','Strong eye for story, framing and light','Can commit to the full 6 months and the working hours','Own laptop and stable internet'],
ARRAY['Experience with Higgsfield, Kling, Seedance or Runway','After Effects or DaVinci Resolve','Interest in film and advertising'],
ARRAY['No fee for learning','Hands-on training from working AI directors','Paid client projects after the learning stage','A salaried team position for those who prove themselves within 6 months','Work on real brand campaigns'],
ARRAY['Higgsfield','Seedance','Kling','ElevenLabs','Suno','Premiere Pro','After Effects','DaVinci Resolve'],
'e1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000003',true,3,'link','Make a 5 to 10 second AI video shot for a local Bangladeshi brand of your choice, with no real shoot. Share a link and 3 lines on how you made it.');
INSERT INTO public.job_questions(job_id,question_id,type,options,required,section,sort_order,knockout_rule)
SELECT 'e2000000-0000-4000-8000-000000000001',q.id,q.type,q.options,q.category<>'setup' OR q.label NOT LIKE 'What laptop%',initcap(q.category),v.n,q.knockout_rule FROM (VALUES
(1,'1ab56416-3360-445e-8ffe-8d5486dda727'::uuid),(2,'8ac274de-472f-4f28-9d26-209e91c650bb'::uuid),(3,'c761c5a8-2b3c-49db-aa22-ec37f4d57e9c'::uuid),(4,'c534a919-18db-45bb-9639-2a693147de56'::uuid),
(5,'3db683bb-f59f-4019-bbae-1452565878d0'::uuid),(6,'04f9e124-27ad-4420-b3d8-6925aa92b693'::uuid),(7,'885ac7d2-9274-404f-bd01-69363b93979a'::uuid),(8,'639c93b1-e57e-4596-8d96-097789b55051'::uuid),
(9,'867ccb05-e5af-4a81-b84d-adc30e18307c'::uuid),(10,'12cca91a-7432-46eb-90b0-461b7fc20e92'::uuid),(11,'331de0c7-ffc1-479a-b706-13b5288a4ff5'::uuid),(12,'da565d41-2012-4344-bf18-7eee9f1dca21'::uuid),(13,'c7fc9a88-583a-419b-a3a9-26d5211a9fb5'::uuid),(14,'9fb76875-4b91-40ad-a25f-55082adff2c9'::uuid),(15,'372d7a6c-dfc9-40e9-a92c-dd8a1d4fdc13'::uuid),(16,'89f82998-fd9b-4020-bd7c-47209b71582d'::uuid)) v(n,id) JOIN public.question_bank q ON q.id=v.id;
DO $$ DECLARE cnt int; BEGIN
 SELECT count(*) INTO cnt FROM public.job_questions WHERE job_id='e2000000-0000-4000-8000-000000000001'; IF cnt<>16 THEN RAISE EXCEPTION 'Expected sixteen questions'; END IF;
 IF (SELECT count(*) FROM public.job_questions WHERE job_id='e2000000-0000-4000-8000-000000000001' AND NOT required)<>1 THEN RAISE EXCEPTION 'Only laptop optional'; END IF;
END $$;
-- Regression fixtures live in a rollback-only subtransaction.
DO $$ BEGIN BEGIN
 INSERT INTO public.talent_pool(full_name,email,interested_in) VALUES('Guard test',' guard-test@example.invalid ',ARRAY['AI Video']);
 BEGIN INSERT INTO public.talent_pool(full_name,email) VALUES('Guard test','GUARD-TEST@example.invalid'); RAISE EXCEPTION 'Daily guard failed'; EXCEPTION WHEN unique_violation THEN NULL; END;
 SET LOCAL ROLE anon;
 IF has_table_privilege('anon','public.talent_pool','SELECT') THEN RAISE EXCEPTION 'Anonymous read granted'; END IF;
 IF EXISTS(SELECT 1 FROM public.jobs WHERE slug='ai-video-artist-intern') THEN RAISE EXCEPTION 'Draft leaked'; END IF;
 INSERT INTO public.talent_pool(full_name,email) VALUES('Public test','public-test@example.invalid');
 RESET ROLE;
 RAISE EXCEPTION 'rollback hiring step two fixtures' USING ERRCODE='ZX002';
 EXCEPTION WHEN SQLSTATE 'ZX002' THEN NULL; END; END $$;