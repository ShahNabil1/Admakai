-- Hiring Step 1. Additive only. Existing public.user_roles is intentionally untouched.
-- Bucket creation is handled by the supported Storage API, not SQL.
CREATE TEMP TABLE hiring_existing_objects_before ON COMMIT DROP AS
SELECT 'function' AS kind,p.oid AS object_id,pg_get_functiondef(p.oid)||coalesce(p.proacl::text,'') AS definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','app') AND p.prokind='f'
UNION ALL SELECT 'policy',p.oid,p.polname||coalesce(pg_get_expr(p.polqual,p.polrelid),'')||coalesce(pg_get_expr(p.polwithcheck,p.polrelid),'')||p.polroles::text||p.polcmd::text FROM pg_policy p
UNION ALL SELECT 'table',c.oid,c.relname||coalesce(c.relacl::text,'')||c.relrowsecurity::text||coalesce((SELECT string_agg(a.attname||':'||format_type(a.atttypid,a.atttypmod)||':'||a.attnotnull::text,',' ORDER BY a.attnum) FROM pg_attribute a WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped),'') FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r'
UNION ALL SELECT 'trigger',t.oid,pg_get_triggerdef(t.oid) FROM pg_trigger t WHERE NOT t.tgisinternal;
CREATE TEMP TABLE hiring_existing_buckets_before ON COMMIT DROP AS SELECT to_jsonb(b) AS definition FROM storage.buckets b;

CREATE TYPE public.app_role AS ENUM ('admin','reviewer','interviewer');
CREATE TABLE public.hiring_user_roles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 role public.app_role NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,role)
);
REVOKE ALL ON public.hiring_user_roles FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.hiring_user_roles TO authenticated; GRANT ALL ON public.hiring_user_roles TO service_role;
ALTER TABLE public.hiring_user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY hiring_roles_own_read ON public.hiring_user_roles FOR SELECT TO authenticated USING (user_id=(SELECT auth.uid()));

CREATE FUNCTION public.has_role(_user_id uuid,_role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.hiring_user_roles WHERE user_id=_user_id AND role=_role) $$;
CREATE FUNCTION public.is_hiring_staff(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.hiring_user_roles WHERE user_id=_user_id AND role IN ('admin','reviewer','interviewer')) $$;
REVOKE ALL ON FUNCTION public.has_role(uuid,public.app_role),public.is_hiring_staff(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role),public.is_hiring_staff(uuid) TO authenticated,service_role;
CREATE POLICY hiring_roles_admin_read ON public.hiring_user_roles FOR SELECT TO authenticated USING (public.has_role((SELECT auth.uid()),'admin'));
-- Hiring grants are deliberately trusted provisioning only; no authenticated role can self-promote.

CREATE TABLE public.candidates (
 id uuid PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE, full_name text NOT NULL DEFAULT '', phone text, whatsapp text, area text, education text, current_occupation text, photo_url text, portfolio_url text, email_notifications boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.candidates FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.candidates TO authenticated; GRANT UPDATE(full_name,phone,whatsapp,area,education,current_occupation,photo_url,portfolio_url,email_notifications) ON public.candidates TO authenticated; GRANT ALL ON public.candidates TO service_role;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY hiring_candidates_read ON public.candidates FOR SELECT TO authenticated USING (id=(SELECT auth.uid()) OR public.is_hiring_staff((SELECT auth.uid())));
CREATE POLICY hiring_candidates_insert ON public.candidates FOR INSERT TO authenticated WITH CHECK (id=(SELECT auth.uid()));
CREATE POLICY hiring_candidates_update ON public.candidates FOR UPDATE TO authenticated USING (id=(SELECT auth.uid())) WITH CHECK (id=(SELECT auth.uid()));

CREATE TABLE public.pipelines (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text NOT NULL,kind text NOT NULL CHECK(kind IN ('application','journey')),is_default boolean NOT NULL DEFAULT false,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.pipelines FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.pipelines TO authenticated; GRANT ALL ON public.pipelines TO service_role;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
CREATE POLICY hiring_pipelines_staff_read ON public.pipelines FOR SELECT TO authenticated USING(public.is_hiring_staff((SELECT auth.uid())));
CREATE POLICY hiring_pipelines_admin_write ON public.pipelines FOR ALL TO authenticated USING(public.has_role((SELECT auth.uid()),'admin')) WITH CHECK(public.has_role((SELECT auth.uid()),'admin'));
CREATE UNIQUE INDEX hiring_pipeline_one_default ON public.pipelines(kind) WHERE is_default;

CREATE TABLE public.pipeline_stages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),pipeline_id uuid NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,key text NOT NULL,admin_label text NOT NULL,candidate_label text NOT NULL,candidate_description text,color text NOT NULL DEFAULT '#6b7280',sort_order int NOT NULL DEFAULT 0,expected_days int CHECK(expected_days>=0),is_terminal boolean NOT NULL DEFAULT false,is_negative boolean NOT NULL DEFAULT false,sends_email boolean NOT NULL DEFAULT true,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),UNIQUE(pipeline_id,key));
REVOKE ALL ON public.pipeline_stages FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.pipeline_stages TO anon; GRANT SELECT,INSERT,UPDATE,DELETE ON public.pipeline_stages TO authenticated; GRANT ALL ON public.pipeline_stages TO service_role;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY hiring_stages_public_read ON public.pipeline_stages FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY hiring_stages_admin_write ON public.pipeline_stages FOR ALL TO authenticated USING(public.has_role((SELECT auth.uid()),'admin')) WITH CHECK(public.has_role((SELECT auth.uid()),'admin'));

CREATE TABLE public.agreement_templates (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text NOT NULL,job_type text NOT NULL CHECK(job_type IN ('internship','full_time','freelance')),version int NOT NULL CHECK(version>0),body text NOT NULL,key_terms jsonb NOT NULL DEFAULT '[]',is_current boolean NOT NULL DEFAULT false,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(name,job_type,version),CHECK(jsonb_typeof(key_terms)='array'));
REVOKE ALL ON public.agreement_templates FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.agreement_templates TO anon; GRANT SELECT,INSERT ON public.agreement_templates TO authenticated; GRANT ALL ON public.agreement_templates TO service_role;
ALTER TABLE public.agreement_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY hiring_templates_public_read ON public.agreement_templates FOR SELECT TO anon,authenticated USING(is_current);
CREATE POLICY hiring_templates_staff_read ON public.agreement_templates FOR SELECT TO authenticated USING(public.is_hiring_staff((SELECT auth.uid())));
CREATE POLICY hiring_templates_admin_insert ON public.agreement_templates FOR INSERT TO authenticated WITH CHECK(public.has_role((SELECT auth.uid()),'admin'));

CREATE TABLE public.jobs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),slug text NOT NULL UNIQUE,title text NOT NULL,type text NOT NULL CHECK(type IN ('internship','full_time','freelance')),work_mode text NOT NULL CHECK(work_mode IN ('office','remote','hybrid')),schedule_text text,summary text,description text,responsibilities text[] NOT NULL DEFAULT '{}',requirements text[] NOT NULL DEFAULT '{}',nice_to_have text[] NOT NULL DEFAULT '{}',benefits text[] NOT NULL DEFAULT '{}',tools text[] NOT NULL DEFAULT '{}',seats int CHECK(seats>0),deadline date,status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','open','closed')),cover_image_url text,application_pipeline_id uuid NOT NULL REFERENCES public.pipelines(id),journey_pipeline_id uuid REFERENCES public.pipelines(id),agreement_template_id uuid REFERENCES public.agreement_templates(id),task_enabled boolean NOT NULL DEFAULT false,task_brief text,task_due_days int CHECK(task_due_days>0),task_submission_type text CHECK(task_submission_type IN ('link','file')),created_by uuid REFERENCES public.profiles(user_id),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.jobs FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.jobs TO anon; GRANT SELECT,INSERT,UPDATE,DELETE ON public.jobs TO authenticated; GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY hiring_jobs_public_read ON public.jobs FOR SELECT TO anon,authenticated USING(status='open');
CREATE POLICY hiring_jobs_staff_read ON public.jobs FOR SELECT TO authenticated USING(public.is_hiring_staff((SELECT auth.uid())));
CREATE POLICY hiring_jobs_admin_write ON public.jobs FOR ALL TO authenticated USING(public.has_role((SELECT auth.uid()),'admin')) WITH CHECK(public.has_role((SELECT auth.uid()),'admin'));

CREATE TABLE public.question_bank (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),category text NOT NULL CHECK(category IN ('commitment','tools','thinking','setup','portfolio','other')),type text NOT NULL CHECK(type IN ('short_text','long_text','single_choice','multi_choice','yes_no','rating','link','file','video_link')),label text NOT NULL,help_text text,options jsonb,max_length int CHECK(max_length>0),knockout_rule jsonb,is_active boolean NOT NULL DEFAULT true,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.question_bank FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.question_bank TO authenticated; GRANT ALL ON public.question_bank TO service_role;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
CREATE POLICY hiring_question_bank_staff_read ON public.question_bank FOR SELECT TO authenticated USING(public.is_hiring_staff((SELECT auth.uid())));
CREATE POLICY hiring_question_bank_admin_write ON public.question_bank FOR ALL TO authenticated USING(public.has_role((SELECT auth.uid()),'admin')) WITH CHECK(public.has_role((SELECT auth.uid()),'admin'));

CREATE TABLE public.job_questions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,question_id uuid REFERENCES public.question_bank(id),label_override text,type text NOT NULL CHECK(type IN ('short_text','long_text','single_choice','multi_choice','yes_no','rating','link','file','video_link')),options jsonb,required boolean NOT NULL DEFAULT false,section text,sort_order int NOT NULL DEFAULT 0,knockout_rule jsonb,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.job_questions FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.job_questions TO anon; GRANT SELECT,INSERT,UPDATE,DELETE ON public.job_questions TO authenticated; GRANT ALL ON public.job_questions TO service_role;
ALTER TABLE public.job_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY hiring_job_questions_public_read ON public.job_questions FOR SELECT TO anon,authenticated USING(EXISTS(SELECT 1 FROM public.jobs j WHERE j.id=job_id AND j.status='open'));
CREATE POLICY hiring_job_questions_staff_read ON public.job_questions FOR SELECT TO authenticated USING(public.is_hiring_staff((SELECT auth.uid())));
CREATE POLICY hiring_job_questions_admin_write ON public.job_questions FOR ALL TO authenticated USING(public.has_role((SELECT auth.uid()),'admin')) WITH CHECK(public.has_role((SELECT auth.uid()),'admin'));

CREATE TABLE public.applications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),public_code text NOT NULL UNIQUE,job_id uuid NOT NULL REFERENCES public.jobs(id),candidate_id uuid NOT NULL REFERENCES public.candidates(id),status_key text NOT NULL DEFAULT 'draft',is_draft boolean NOT NULL DEFAULT true,current_step int NOT NULL DEFAULT 1 CHECK(current_step>=1),submitted_at timestamptz,withdrawn_at timestamptz,task_submission_url text,task_submitted_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),UNIQUE(job_id,candidate_id));
REVOKE ALL ON public.applications FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.applications TO authenticated; GRANT UPDATE(current_step,task_submission_url) ON public.applications TO authenticated; GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY hiring_applications_read ON public.applications FOR SELECT TO authenticated USING(candidate_id=(SELECT auth.uid()) OR public.is_hiring_staff((SELECT auth.uid())));
CREATE POLICY hiring_applications_candidate_insert ON public.applications FOR INSERT TO authenticated WITH CHECK(candidate_id=(SELECT auth.uid()) AND is_draft AND status_key='draft' AND submitted_at IS NULL AND withdrawn_at IS NULL AND EXISTS(SELECT 1 FROM public.jobs j WHERE j.id=job_id AND j.status='open'));
CREATE POLICY hiring_applications_candidate_update ON public.applications FOR UPDATE TO authenticated USING(candidate_id=(SELECT auth.uid()) AND is_draft) WITH CHECK(candidate_id=(SELECT auth.uid()) AND is_draft AND status_key='draft');

CREATE FUNCTION public.hiring_owns_application(_application_id uuid,_draft_only boolean DEFAULT false) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.applications WHERE id=_application_id AND candidate_id=auth.uid() AND (NOT _draft_only OR is_draft)) $$;
REVOKE ALL ON FUNCTION public.hiring_owns_application(uuid,boolean) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.hiring_owns_application(uuid,boolean) TO authenticated,service_role;

CREATE TABLE public.application_answers (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,job_question_id uuid NOT NULL REFERENCES public.job_questions(id),answer jsonb,file_url text,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),UNIQUE(application_id,job_question_id));
REVOKE ALL ON public.application_answers FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.application_answers TO authenticated; GRANT UPDATE(answer,file_url) ON public.application_answers TO authenticated; GRANT ALL ON public.application_answers TO service_role;
ALTER TABLE public.application_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY hiring_answers_read ON public.application_answers FOR SELECT TO authenticated USING(public.hiring_owns_application(application_id) OR public.is_hiring_staff((SELECT auth.uid())));
CREATE POLICY hiring_answers_candidate_insert ON public.application_answers FOR INSERT TO authenticated WITH CHECK(public.hiring_owns_application(application_id,true));
CREATE POLICY hiring_answers_candidate_update ON public.application_answers FOR UPDATE TO authenticated USING(public.hiring_owns_application(application_id,true)) WITH CHECK(public.hiring_owns_application(application_id,true));

CREATE TABLE public.application_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,from_status text,to_status text NOT NULL,message_to_candidate text,reason text,visible_to_candidate boolean NOT NULL DEFAULT true,created_by uuid REFERENCES public.profiles(user_id),created_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.application_events FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.application_events TO authenticated; GRANT ALL ON public.application_events TO service_role;
ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY hiring_application_events_read ON public.application_events FOR SELECT TO authenticated USING(public.is_hiring_staff((SELECT auth.uid())) OR (visible_to_candidate AND public.hiring_owns_application(application_id)));

CREATE TABLE public.application_reviews (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,reviewer_id uuid NOT NULL REFERENCES public.profiles(user_id),skill_score int CHECK(skill_score BETWEEN 1 AND 5),thinking_score int CHECK(thinking_score BETWEEN 1 AND 5),commitment_score int CHECK(commitment_score BETWEEN 1 AND 5),knockout_flags jsonb NOT NULL DEFAULT '[]',assigned_reviewer_id uuid REFERENCES public.profiles(user_id),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.application_reviews FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.application_reviews TO authenticated; GRANT UPDATE(skill_score,thinking_score,commitment_score,knockout_flags,assigned_reviewer_id) ON public.application_reviews TO authenticated; GRANT ALL ON public.application_reviews TO service_role;
ALTER TABLE public.application_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY hiring_reviews_staff_read ON public.application_reviews FOR SELECT TO authenticated USING(public.is_hiring_staff((SELECT auth.uid())));
CREATE POLICY hiring_reviews_reviewer_insert ON public.application_reviews FOR INSERT TO authenticated WITH CHECK((public.has_role((SELECT auth.uid()),'reviewer') OR public.has_role((SELECT auth.uid()),'admin')) AND reviewer_id=(SELECT auth.uid()));
CREATE POLICY hiring_reviews_reviewer_update ON public.application_reviews FOR UPDATE TO authenticated USING(public.has_role((SELECT auth.uid()),'admin') OR (public.has_role((SELECT auth.uid()),'reviewer') AND reviewer_id=(SELECT auth.uid()))) WITH CHECK(public.has_role((SELECT auth.uid()),'admin') OR (public.has_role((SELECT auth.uid()),'reviewer') AND reviewer_id=(SELECT auth.uid())));

CREATE TABLE public.internal_notes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,author_id uuid NOT NULL REFERENCES public.profiles(user_id),body text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.internal_notes FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.internal_notes TO authenticated; GRANT ALL ON public.internal_notes TO service_role;
ALTER TABLE public.internal_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY hiring_notes_staff_read ON public.internal_notes FOR SELECT TO authenticated USING(public.is_hiring_staff((SELECT auth.uid())));
CREATE POLICY hiring_notes_reviewer_insert ON public.internal_notes FOR INSERT TO authenticated WITH CHECK((public.has_role((SELECT auth.uid()),'reviewer') OR public.has_role((SELECT auth.uid()),'admin')) AND author_id=(SELECT auth.uid()));

CREATE TABLE public.interviews (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,scheduled_at timestamptz NOT NULL,duration_minutes int NOT NULL DEFAULT 30 CHECK(duration_minutes>0),mode text NOT NULL CHECK(mode IN ('meet','office')),meet_link text,office_address text,interviewer_id uuid NOT NULL REFERENCES public.profiles(user_id),status text NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','done','cancelled','rescheduled')),result_score int CHECK(result_score BETWEEN 1 AND 5),strengths text,concerns text,recommendation text CHECK(recommendation IN ('select','reject','another_round')),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.interviews FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.interviews TO authenticated; GRANT UPDATE(scheduled_at,duration_minutes,mode,meet_link,office_address,status,result_score,strengths,concerns,recommendation) ON public.interviews TO authenticated; GRANT ALL ON public.interviews TO service_role;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY hiring_interviews_staff_read ON public.interviews FOR SELECT TO authenticated USING(public.has_role((SELECT auth.uid()),'admin') OR public.has_role((SELECT auth.uid()),'reviewer') OR (public.has_role((SELECT auth.uid()),'interviewer') AND interviewer_id=(SELECT auth.uid())));
CREATE POLICY hiring_interviews_admin_insert ON public.interviews FOR INSERT TO authenticated WITH CHECK(public.has_role((SELECT auth.uid()),'admin'));
CREATE POLICY hiring_interviews_assigned_update ON public.interviews FOR UPDATE TO authenticated USING(public.has_role((SELECT auth.uid()),'admin') OR (public.has_role((SELECT auth.uid()),'interviewer') AND interviewer_id=(SELECT auth.uid()))) WITH CHECK(public.has_role((SELECT auth.uid()),'admin') OR (public.has_role((SELECT auth.uid()),'interviewer') AND interviewer_id=(SELECT auth.uid())));
-- Owner-rights view with mandatory UID predicate, explicitly safe columns, and no write grant.
-- An invoker view cannot work here because candidates must not receive base-table assessment access.
CREATE VIEW public.candidate_interviews WITH (security_barrier=true) AS SELECT i.id,i.application_id,i.scheduled_at,i.duration_minutes,i.mode,i.meet_link,i.office_address,i.status FROM public.interviews i JOIN public.applications a ON a.id=i.application_id WHERE a.candidate_id=(SELECT auth.uid());
REVOKE ALL ON public.candidate_interviews FROM PUBLIC,anon,authenticated; GRANT SELECT ON public.candidate_interviews TO authenticated,service_role;

CREATE TABLE public.signed_agreements (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),application_id uuid NOT NULL UNIQUE REFERENCES public.applications(id) ON DELETE CASCADE,template_id uuid NOT NULL REFERENCES public.agreement_templates(id),template_version int NOT NULL,signer_full_name text NOT NULL,signature_path text NOT NULL,pdf_path text NOT NULL,pdf_sha256 text NOT NULL CHECK(pdf_sha256 ~ '^[0-9a-fA-F]{64}$'),signed_at timestamptz NOT NULL DEFAULT now(),ip_address inet,user_agent text,accepted_terms jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.signed_agreements FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.signed_agreements TO authenticated; GRANT ALL ON public.signed_agreements TO service_role;
ALTER TABLE public.signed_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY hiring_signed_agreements_read ON public.signed_agreements FOR SELECT TO authenticated USING(public.hiring_owns_application(application_id) OR public.is_hiring_staff((SELECT auth.uid())));

CREATE TABLE public.member_journeys (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),application_id uuid NOT NULL UNIQUE REFERENCES public.applications(id),candidate_id uuid NOT NULL REFERENCES public.candidates(id),job_id uuid NOT NULL REFERENCES public.jobs(id),pipeline_id uuid NOT NULL REFERENCES public.pipelines(id),stage_key text NOT NULL,stage_started_at timestamptz NOT NULL DEFAULT now(),mentor_id uuid REFERENCES public.profiles(user_id),started_at timestamptz NOT NULL DEFAULT now(),ended_at timestamptz,end_reason text,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),FOREIGN KEY(pipeline_id,stage_key) REFERENCES public.pipeline_stages(pipeline_id,key));
REVOKE ALL ON public.member_journeys FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.member_journeys TO authenticated; GRANT ALL ON public.member_journeys TO service_role;
ALTER TABLE public.member_journeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY hiring_journeys_read ON public.member_journeys FOR SELECT TO authenticated USING(candidate_id=(SELECT auth.uid()) OR public.is_hiring_staff((SELECT auth.uid())));
CREATE POLICY hiring_journeys_admin_insert ON public.member_journeys FOR INSERT TO authenticated WITH CHECK(public.has_role((SELECT auth.uid()),'admin'));

CREATE FUNCTION public.hiring_owns_journey(_journey_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.member_journeys WHERE id=_journey_id AND candidate_id=auth.uid()) $$;
REVOKE ALL ON FUNCTION public.hiring_owns_journey(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.hiring_owns_journey(uuid) TO authenticated,service_role;

CREATE TABLE public.journey_milestones (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),journey_id uuid NOT NULL REFERENCES public.member_journeys(id) ON DELETE CASCADE,stage_key text NOT NULL,title text NOT NULL,is_done boolean NOT NULL DEFAULT false,done_at timestamptz,sort_order int NOT NULL DEFAULT 0,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.journey_milestones FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.journey_milestones TO authenticated; GRANT ALL ON public.journey_milestones TO service_role;
ALTER TABLE public.journey_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY hiring_milestones_read ON public.journey_milestones FOR SELECT TO authenticated USING(public.hiring_owns_journey(journey_id) OR public.is_hiring_staff((SELECT auth.uid())));
CREATE POLICY hiring_milestones_admin_write ON public.journey_milestones FOR ALL TO authenticated USING(public.has_role((SELECT auth.uid()),'admin')) WITH CHECK(public.has_role((SELECT auth.uid()),'admin'));

CREATE TABLE public.journey_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),journey_id uuid NOT NULL REFERENCES public.member_journeys(id) ON DELETE CASCADE,from_stage text,to_stage text NOT NULL,note text,visible_to_candidate boolean NOT NULL DEFAULT true,letter_path text,created_by uuid REFERENCES public.profiles(user_id),created_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.journey_events FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.journey_events TO authenticated; GRANT ALL ON public.journey_events TO service_role;
ALTER TABLE public.journey_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY hiring_journey_events_read ON public.journey_events FOR SELECT TO authenticated USING(public.is_hiring_staff((SELECT auth.uid())) OR (visible_to_candidate AND public.hiring_owns_journey(journey_id)));

CREATE TABLE public.journey_projects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),journey_id uuid NOT NULL REFERENCES public.member_journeys(id) ON DELETE CASCADE,title text NOT NULL,is_client_work boolean NOT NULL DEFAULT false,is_paid boolean NOT NULL DEFAULT false,amount numeric CHECK(amount>=0),started_at timestamptz,finished_at timestamptz,note text,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.journey_projects FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.journey_projects TO authenticated; GRANT ALL ON public.journey_projects TO service_role;
ALTER TABLE public.journey_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY hiring_projects_read ON public.journey_projects FOR SELECT TO authenticated USING(public.hiring_owns_journey(journey_id) OR public.is_hiring_staff((SELECT auth.uid())));
CREATE POLICY hiring_projects_admin_write ON public.journey_projects FOR ALL TO authenticated USING(public.has_role((SELECT auth.uid()),'admin')) WITH CHECK(public.has_role((SELECT auth.uid()),'admin'));

CREATE TABLE public.documents (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),candidate_id uuid NOT NULL REFERENCES public.candidates(id),kind text NOT NULL CHECK(kind IN ('agreement','offer_letter','promotion_letter','cv','other')),title text NOT NULL,file_path text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.documents FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.documents TO authenticated; GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY hiring_documents_read ON public.documents FOR SELECT TO authenticated USING(candidate_id=(SELECT auth.uid()) OR public.is_hiring_staff((SELECT auth.uid())));
CREATE POLICY hiring_documents_admin_insert ON public.documents FOR INSERT TO authenticated WITH CHECK(public.has_role((SELECT auth.uid()),'admin'));

CREATE TABLE public.email_templates (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),trigger_key text NOT NULL UNIQUE,subject text NOT NULL,body text NOT NULL,is_enabled boolean NOT NULL DEFAULT true,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.email_templates FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.email_templates TO authenticated; GRANT ALL ON public.email_templates TO service_role;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY hiring_email_templates_staff_read ON public.email_templates FOR SELECT TO authenticated USING(public.is_hiring_staff((SELECT auth.uid())));
CREATE POLICY hiring_email_templates_admin_write ON public.email_templates FOR ALL TO authenticated USING(public.has_role((SELECT auth.uid()),'admin')) WITH CHECK(public.has_role((SELECT auth.uid()),'admin'));

CREATE TABLE public.email_log (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),application_id uuid REFERENCES public.applications(id),to_email text NOT NULL,trigger_key text NOT NULL REFERENCES public.email_templates(trigger_key),status text NOT NULL CHECK(status IN ('sent','failed')),provider_id text,error text,created_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.email_log FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.email_log TO authenticated; GRANT ALL ON public.email_log TO service_role;
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY hiring_email_log_staff_read ON public.email_log FOR SELECT TO authenticated USING(public.is_hiring_staff((SELECT auth.uid())));

CREATE TABLE public.hiring_settings (id boolean PRIMARY KEY DEFAULT true CHECK(id),from_email text NOT NULL DEFAULT 'careers@admakai.com',reply_to text,company_address text,pdf_logo_url text,authorised_signature_url text,notify_admin_emails text[] NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.hiring_settings FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.hiring_settings TO authenticated; GRANT ALL ON public.hiring_settings TO service_role;
ALTER TABLE public.hiring_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY hiring_settings_staff_read ON public.hiring_settings FOR SELECT TO authenticated USING(public.is_hiring_staff((SELECT auth.uid())));
CREATE POLICY hiring_settings_admin_write ON public.hiring_settings FOR ALL TO authenticated USING(public.has_role((SELECT auth.uid()),'admin')) WITH CHECK(public.has_role((SELECT auth.uid()),'admin'));

-- New timestamp helper only. Never replace existing touch_updated_at.
CREATE FUNCTION public.hiring_touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN NEW.updated_at:=now(); RETURN NEW; END $$;
CREATE FUNCTION public.hiring_reject_mutation() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN RAISE EXCEPTION 'Hiring history and signed versions are immutable' USING ERRCODE='42501'; END $$;
CREATE TRIGGER hiring_templates_immutable BEFORE UPDATE OR DELETE ON public.agreement_templates FOR EACH ROW EXECUTE FUNCTION public.hiring_reject_mutation();
CREATE TRIGGER hiring_signed_immutable BEFORE UPDATE OR DELETE ON public.signed_agreements FOR EACH ROW EXECUTE FUNCTION public.hiring_reject_mutation();
CREATE TRIGGER hiring_application_events_immutable BEFORE UPDATE OR DELETE ON public.application_events FOR EACH ROW EXECUTE FUNCTION public.hiring_reject_mutation();
CREATE TRIGGER hiring_journey_events_immutable BEFORE UPDATE OR DELETE ON public.journey_events FOR EACH ROW EXECUTE FUNCTION public.hiring_reject_mutation();

-- Immutable agreement body/version; switching the current pointer is internal to version creation.
CREATE FUNCTION public.hiring_template_version_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE previous_version int;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('hiring-template:'||NEW.name||':'||NEW.job_type,0));
 SELECT max(version) INTO previous_version FROM public.agreement_templates WHERE name=NEW.name AND job_type=NEW.job_type;
 IF NEW.version<>coalesce(previous_version,0)+1 THEN RAISE EXCEPTION 'Template version must increase by one' USING ERRCODE='23514'; END IF;
 -- Current is resolved by the latest marked-current version, without mutating any older row.
 RETURN NEW;
END $$;
CREATE TRIGGER hiring_template_version BEFORE INSERT ON public.agreement_templates FOR EACH ROW EXECUTE FUNCTION public.hiring_template_version_guard();
-- Hide historical marked-current versions from anonymous reads without changing any existing policy.
CREATE FUNCTION public.hiring_template_is_latest(_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.agreement_templates t WHERE t.id=_id AND t.is_current AND NOT EXISTS(SELECT 1 FROM public.agreement_templates newer WHERE newer.name=t.name AND newer.job_type=t.job_type AND newer.is_current AND newer.version>t.version)) $$;
REVOKE ALL ON FUNCTION public.hiring_template_is_latest(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hiring_template_is_latest(uuid) TO anon,authenticated,service_role;
CREATE POLICY hiring_templates_latest_public ON public.agreement_templates AS RESTRICTIVE FOR SELECT TO anon,authenticated USING(public.hiring_template_is_latest(id) OR (auth.uid() IS NOT NULL AND public.is_hiring_staff(auth.uid())));
-- Anonymous evaluation of the staff branch must be safe; role helpers reveal booleans only.
GRANT EXECUTE ON FUNCTION public.is_hiring_staff(uuid) TO anon;

CREATE FUNCTION public.hiring_application_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE prefix text; counter bigint;
BEGIN
 IF TG_OP='INSERT' THEN
  IF NOT NEW.is_draft OR NEW.status_key<>'draft' OR NEW.submitted_at IS NOT NULL OR NEW.withdrawn_at IS NOT NULL THEN RAISE EXCEPTION 'Applications must start as drafts' USING ERRCODE='42501'; END IF;
  prefix:='ADM-'||to_char(now() AT TIME ZONE 'Asia/Dhaka','YYMM')||'-';
  PERFORM pg_advisory_xact_lock(hashtextextended('hiring-code:'||prefix,0));
  SELECT coalesce(max(split_part(public_code,'-',3)::bigint),0)+1 INTO counter FROM public.applications WHERE public_code LIKE prefix||'%';
  NEW.public_code:=prefix||CASE WHEN counter<10000 THEN lpad(counter::text,4,'0') ELSE counter::text END;
 ELSE
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.job_id IS DISTINCT FROM OLD.job_id OR NEW.candidate_id IS DISTINCT FROM OLD.candidate_id OR NEW.public_code IS DISTINCT FROM OLD.public_code OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN RAISE EXCEPTION 'Application identity is immutable' USING ERRCODE='42501'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER hiring_application_identity BEFORE INSERT OR UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.hiring_application_guard();

CREATE FUNCTION public.hiring_answer_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a public.applications; q public.job_questions;
BEGIN
 SELECT * INTO a FROM public.applications WHERE id=NEW.application_id FOR UPDATE;
 IF NOT FOUND OR NOT a.is_draft THEN RAISE EXCEPTION 'Answers require a draft application' USING ERRCODE='42501'; END IF;
 SELECT * INTO q FROM public.job_questions WHERE id=NEW.job_question_id;
 IF NOT FOUND OR q.job_id<>a.job_id THEN RAISE EXCEPTION 'Question does not belong to this job' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (NEW.application_id<>OLD.application_id OR NEW.job_question_id<>OLD.job_question_id OR NEW.id<>OLD.id OR NEW.created_at<>OLD.created_at) THEN RAISE EXCEPTION 'Answer identity is immutable' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER hiring_answer_validation BEFORE INSERT OR UPDATE ON public.application_answers FOR EACH ROW EXECUTE FUNCTION public.hiring_answer_guard();

CREATE FUNCTION public.hiring_job_pipeline_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.pipelines WHERE id=NEW.application_pipeline_id AND kind='application') THEN RAISE EXCEPTION 'Application pipeline required' USING ERRCODE='23514'; END IF;
 IF NEW.journey_pipeline_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.pipelines WHERE id=NEW.journey_pipeline_id AND kind='journey') THEN RAISE EXCEPTION 'Journey pipeline required' USING ERRCODE='23514'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER hiring_job_pipeline_validation BEFORE INSERT OR UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.hiring_job_pipeline_guard();

CREATE FUNCTION public.hiring_journey_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.applications a JOIN public.jobs j ON j.id=a.job_id WHERE a.id=NEW.application_id AND a.candidate_id=NEW.candidate_id AND a.job_id=NEW.job_id AND j.journey_pipeline_id=NEW.pipeline_id) THEN RAISE EXCEPTION 'Journey must match its application and job pipeline' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (NEW.application_id<>OLD.application_id OR NEW.candidate_id<>OLD.candidate_id OR NEW.job_id<>OLD.job_id OR NEW.pipeline_id<>OLD.pipeline_id) THEN RAISE EXCEPTION 'Journey identity is immutable' USING ERRCODE='42501'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER hiring_journey_validation BEFORE INSERT OR UPDATE ON public.member_journeys FOR EACH ROW EXECUTE FUNCTION public.hiring_journey_guard();

CREATE FUNCTION public.hiring_milestone_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.member_journeys j JOIN public.pipeline_stages s ON s.pipeline_id=j.pipeline_id WHERE j.id=NEW.journey_id AND s.key=NEW.stage_key) THEN RAISE EXCEPTION 'Milestone stage must belong to journey pipeline' USING ERRCODE='23514'; END IF;
 IF NEW.is_done THEN NEW.done_at:=coalesce(NEW.done_at,now()); ELSE NEW.done_at:=NULL; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER hiring_milestone_validation BEFORE INSERT OR UPDATE ON public.journey_milestones FOR EACH ROW EXECUTE FUNCTION public.hiring_milestone_guard();

CREATE FUNCTION public.hiring_signed_agreement_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a public.applications; t public.agreement_templates; candidate_prefix text;
BEGIN
 SELECT * INTO a FROM public.applications WHERE id=NEW.application_id FOR UPDATE;
 IF NOT FOUND OR NOT a.is_draft THEN RAISE EXCEPTION 'Agreement requires draft application' USING ERRCODE='23514'; END IF;
 SELECT t0.* INTO t FROM public.agreement_templates t0 JOIN public.jobs j ON j.agreement_template_id=t0.id WHERE j.id=a.job_id AND t0.id=NEW.template_id;
 IF NOT FOUND OR NEW.template_version<>t.version THEN RAISE EXCEPTION 'Agreement template must match job and version' USING ERRCODE='23514'; END IF;
 IF btrim(NEW.signer_full_name)='' OR jsonb_typeof(NEW.accepted_terms)<>'array' OR NOT (NEW.accepted_terms @> t.key_terms) THEN RAISE EXCEPTION 'All agreement terms must be accepted' USING ERRCODE='23514'; END IF;
 candidate_prefix:=a.candidate_id::text||'/'||a.id::text||'/';
 IF NEW.signature_path NOT LIKE candidate_prefix||'%' OR NEW.pdf_path NOT LIKE candidate_prefix||'%' THEN RAISE EXCEPTION 'Agreement file paths must belong to the application' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER hiring_signed_validation BEFORE INSERT ON public.signed_agreements FOR EACH ROW EXECUTE FUNCTION public.hiring_signed_agreement_guard();

CREATE FUNCTION public.change_application_status(_application_id uuid,_to_status text,_message text,_reason text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a public.applications; target public.pipeline_stages; event_id uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_hiring_staff(auth.uid()) THEN RAISE EXCEPTION 'Hiring staff required' USING ERRCODE='42501'; END IF;
 SELECT * INTO a FROM public.applications WHERE id=_application_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Application not found' USING ERRCODE='P0002'; END IF;
 IF a.is_draft THEN RAISE EXCEPTION 'Candidate must submit the application first' USING ERRCODE='23514'; END IF;
 SELECT s.* INTO target FROM public.pipeline_stages s JOIN public.jobs j ON j.application_pipeline_id=s.pipeline_id WHERE j.id=a.job_id AND s.key=_to_status;
 IF NOT FOUND THEN RAISE EXCEPTION 'Target stage is not in the job pipeline' USING ERRCODE='23514'; END IF;
 IF target.is_negative AND coalesce(btrim(_reason),'')='' THEN RAISE EXCEPTION 'A reason is required for a negative stage' USING ERRCODE='23514'; END IF;
 IF a.status_key=_to_status THEN RAISE EXCEPTION 'Application is already at this stage' USING ERRCODE='23514'; END IF;
 UPDATE public.applications SET status_key=_to_status,withdrawn_at=CASE WHEN _to_status='withdrawn' THEN now() ELSE withdrawn_at END WHERE id=a.id;
 INSERT INTO public.application_events(application_id,from_status,to_status,message_to_candidate,reason,created_by) VALUES(a.id,a.status_key,_to_status,_message,_reason,auth.uid()) RETURNING id INTO event_id;
 RETURN event_id;
END $$;

CREATE FUNCTION public.change_journey_stage(_journey_id uuid,_to_stage text,_note text,_visible boolean) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE j public.member_journeys; target public.pipeline_stages; event_id uuid;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_hiring_staff(auth.uid()) THEN RAISE EXCEPTION 'Hiring staff required' USING ERRCODE='42501'; END IF;
 SELECT * INTO j FROM public.member_journeys WHERE id=_journey_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Journey not found' USING ERRCODE='P0002'; END IF;
 SELECT * INTO target FROM public.pipeline_stages WHERE pipeline_id=j.pipeline_id AND key=_to_stage;
 IF NOT FOUND THEN RAISE EXCEPTION 'Target stage is not in the journey pipeline' USING ERRCODE='23514'; END IF;
 IF target.is_negative AND coalesce(btrim(_note),'')='' THEN RAISE EXCEPTION 'A note is required for a negative stage' USING ERRCODE='23514'; END IF;
 IF j.stage_key=_to_stage THEN RAISE EXCEPTION 'Journey is already at this stage' USING ERRCODE='23514'; END IF;
 UPDATE public.member_journeys SET stage_key=_to_stage,stage_started_at=now(),ended_at=CASE WHEN target.is_terminal THEN now() ELSE NULL END,end_reason=CASE WHEN target.is_negative THEN _note ELSE NULL END WHERE id=j.id;
 INSERT INTO public.journey_events(journey_id,from_stage,to_stage,note,visible_to_candidate,created_by) VALUES(j.id,j.stage_key,_to_stage,_note,coalesce(_visible,true),auth.uid()) RETURNING id INTO event_id;
 RETURN event_id;
END $$;

CREATE FUNCTION public.submit_application(_application_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a public.applications; first_stage public.pipeline_stages; agreement public.signed_agreements; event_id uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required' USING ERRCODE='42501'; END IF;
 SELECT * INTO a FROM public.applications WHERE id=_application_id FOR UPDATE;
 IF NOT FOUND OR a.candidate_id<>auth.uid() THEN RAISE EXCEPTION 'Application ownership required' USING ERRCODE='42501'; END IF;
 IF NOT a.is_draft THEN RAISE EXCEPTION 'Application already submitted' USING ERRCODE='23514'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.jobs WHERE id=a.job_id AND status='open') THEN RAISE EXCEPTION 'Job is not open' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM public.job_questions q LEFT JOIN public.application_answers ans ON ans.job_question_id=q.id AND ans.application_id=a.id WHERE q.job_id=a.job_id AND q.required AND (ans.id IS NULL OR (q.type='file' AND coalesce(btrim(ans.file_url),'')='') OR (q.type<>'file' AND (ans.answer IS NULL OR ans.answer IN ('null'::jsonb,'""'::jsonb,'[]'::jsonb,'{}'::jsonb) OR (jsonb_typeof(ans.answer)='string' AND btrim(ans.answer#>>'{}')=''))))) THEN RAISE EXCEPTION 'All required answers must be completed' USING ERRCODE='23514'; END IF;
 SELECT * INTO agreement FROM public.signed_agreements WHERE application_id=a.id;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.jobs j JOIN public.agreement_templates t ON t.id=j.agreement_template_id WHERE j.id=a.job_id AND agreement.template_id=t.id AND agreement.template_version=t.version AND agreement.accepted_terms @> t.key_terms) THEN RAISE EXCEPTION 'Signed agreement required for the job template version' USING ERRCODE='23514'; END IF;
 SELECT s.* INTO first_stage FROM public.pipeline_stages s JOIN public.jobs j ON j.application_pipeline_id=s.pipeline_id WHERE j.id=a.job_id ORDER BY s.sort_order,s.id LIMIT 1;
 IF NOT FOUND THEN RAISE EXCEPTION 'Application pipeline has no stages' USING ERRCODE='23514'; END IF;
 UPDATE public.applications SET is_draft=false,submitted_at=now(),status_key=first_stage.key WHERE id=a.id;
 INSERT INTO public.application_events(application_id,from_status,to_status,message_to_candidate,created_by) VALUES(a.id,'draft',first_stage.key,first_stage.candidate_label,auth.uid()) RETURNING id INTO event_id;
 RETURN event_id;
END $$;
REVOKE ALL ON FUNCTION public.change_application_status(uuid,text,text,text),public.change_journey_stage(uuid,text,text,boolean),public.submit_application(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.change_application_status(uuid,text,text,text),public.change_journey_stage(uuid,text,text,boolean),public.submit_application(uuid) TO authenticated,service_role;
-- Applications and journey status have no authenticated UPDATE grant, including column grants.
REVOKE UPDATE(status_key,is_draft,submitted_at,withdrawn_at,task_submitted_at) ON public.applications FROM authenticated;

CREATE FUNCTION public.hiring_storage_path_owned(_name text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT auth.uid() IS NOT NULL AND split_part(_name,'/',1)=auth.uid()::text AND split_part(_name,'/',3)<>'' AND array_length(string_to_array(_name,'/'),1)=3 AND EXISTS(SELECT 1 FROM public.applications a WHERE a.id::text=split_part(_name,'/',2) AND a.candidate_id=auth.uid()) $$;
REVOKE ALL ON FUNCTION public.hiring_storage_path_owned(text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.hiring_storage_path_owned(text) TO authenticated,service_role;
CREATE POLICY hiring_files_candidate_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id IN ('resumes','signatures','agreements','letters','task-files') AND public.hiring_storage_path_owned(name));
CREATE POLICY hiring_files_candidate_upload ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id IN ('resumes','signatures','agreements','letters','task-files') AND public.hiring_storage_path_owned(name));
CREATE POLICY hiring_files_staff_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id IN ('resumes','signatures','agreements','letters','task-files') AND public.is_hiring_staff((SELECT auth.uid())));
-- No candidate overwrites/deletes; generated PDFs/letters and signed records use trusted service writes in later steps.

DO $$ DECLARE tbl text; col text; BEGIN
 FOREACH tbl IN ARRAY ARRAY['candidates','pipelines','pipeline_stages','jobs','question_bank','job_questions','applications','application_answers','application_reviews','interviews','member_journeys','journey_milestones','journey_projects','email_templates','hiring_settings'] LOOP
  EXECUTE format('CREATE TRIGGER hiring_%I_touch BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.hiring_touch_updated_at()',tbl,tbl);
 END LOOP;
 FOREACH tbl IN ARRAY ARRAY['hiring_user_roles','candidates','pipelines','pipeline_stages','agreement_templates','jobs','question_bank','job_questions','applications','application_answers','application_events','application_reviews','internal_notes','interviews','signed_agreements','member_journeys','journey_milestones','journey_events','journey_projects','documents','email_templates','email_log','hiring_settings'] LOOP
  EXECUTE format('CREATE INDEX hiring_%I_created_idx ON public.%I(created_at)',tbl,tbl);
 END LOOP;
 FOR tbl,col IN SELECT * FROM (VALUES ('pipeline_stages','pipeline_id'),('jobs','status'),('jobs','application_pipeline_id'),('jobs','journey_pipeline_id'),('jobs','agreement_template_id'),('jobs','created_by'),('job_questions','job_id'),('job_questions','question_id'),('applications','status_key'),('applications','candidate_id'),('application_answers','job_question_id'),('application_events','application_id'),('application_reviews','application_id'),('application_reviews','reviewer_id'),('application_reviews','assigned_reviewer_id'),('internal_notes','application_id'),('internal_notes','author_id'),('interviews','application_id'),('interviews','interviewer_id'),('signed_agreements','template_id'),('member_journeys','candidate_id'),('member_journeys','job_id'),('member_journeys','mentor_id'),('journey_milestones','journey_id'),('journey_events','journey_id'),('journey_projects','journey_id'),('documents','candidate_id'),('email_log','application_id'),('email_log','trigger_key')) v(t,c) LOOP
  EXECUTE format('CREATE INDEX hiring_%I_%I_idx ON public.%I(%I)',tbl,col,tbl,col);
 END LOOP;
END $$;
-- Trigger entry points are not public RPCs.
REVOKE ALL ON FUNCTION public.hiring_touch_updated_at(),public.hiring_reject_mutation(),public.hiring_template_version_guard(),public.hiring_application_guard(),public.hiring_answer_guard(),public.hiring_job_pipeline_guard(),public.hiring_journey_guard(),public.hiring_milestone_guard(),public.hiring_signed_agreement_guard() FROM PUBLIC,anon,authenticated;

INSERT INTO public.pipelines(id,name,kind,is_default) VALUES ('e1000000-0000-4000-8000-000000000001','Default hiring','application',true),('e1000000-0000-4000-8000-000000000002','Admakai Internship Program','journey',true);
INSERT INTO public.pipeline_stages(pipeline_id,key,admin_label,candidate_label,candidate_description,color,sort_order,expected_days,is_terminal,is_negative) VALUES
('e1000000-0000-4000-8000-000000000001','submitted','Application Submitted','Application Submitted','Your application has been received. The next update is usually within 2 days.','#2563eb',1,2,false,false),
('e1000000-0000-4000-8000-000000000001','in_review','In Review','In Review','Our team is reviewing your application. The next update is usually within 3 days.','#6366f1',2,3,false,false),
('e1000000-0000-4000-8000-000000000001','shortlisted','Shortlisted, task assigned','Shortlisted, task assigned','You have been shortlisted. Please check your assigned task. The next update is usually within 5 days.','#0891b2',3,5,false,false),
('e1000000-0000-4000-8000-000000000001','interview_scheduled','Interview Scheduled','Interview Scheduled','Your interview details will appear in your tracker.','#7c3aed',4,0,false,false),
('e1000000-0000-4000-8000-000000000001','interview_done','Interview Done','Interview Done','Thank you for meeting us. The next update is usually within 3 days.','#0d9488',5,3,false,false),
('e1000000-0000-4000-8000-000000000001','selected','Selected','Selected','You have been selected. The next update is usually within 2 days.','#16a34a',6,2,false,false),
('e1000000-0000-4000-8000-000000000001','offer','Offer and Agreement','Offer and Agreement','Please review your offer and agreement. The next update is usually within 3 days.','#15803d',7,3,false,false),
('e1000000-0000-4000-8000-000000000001','hired','Hired','Hired','Welcome to Admakai.','#166534',8,NULL,true,false),
('e1000000-0000-4000-8000-000000000001','rejected','Not selected this time','Not selected this time','Thank you for your interest. You were not selected this time.','#dc2626',9,NULL,true,true),
('e1000000-0000-4000-8000-000000000001','waitlist','Waitlist','Waitlist','Your application is on the waitlist. The next update is usually within 14 days.','#d97706',10,14,false,false),
('e1000000-0000-4000-8000-000000000001','withdrawn','Withdrawn','Withdrawn','Your application has been withdrawn.','#6b7280',11,NULL,true,false),
('e1000000-0000-4000-8000-000000000002','onboarding','Onboarding','Onboarding','Welcome. Your onboarding period is usually 7 days.','#2563eb',1,7,false,false),
('e1000000-0000-4000-8000-000000000002','learner','Learner','Learner','Hands-on learning beside the team, usually for 60 days.','#0891b2',2,60,false,false),
('e1000000-0000-4000-8000-000000000002','project','Project Stage','Project Stage','Project-based work, usually for 120 days.','#7c3aed',3,120,false,false),
('e1000000-0000-4000-8000-000000000002','salary','Salary, Team Member','Salary, Team Member','You are now a salaried team member.','#16a34a',4,NULL,true,false),
('e1000000-0000-4000-8000-000000000002','paused','Paused','Paused','Your program is paused. Please check your latest update.','#d97706',5,NULL,false,false),
('e1000000-0000-4000-8000-000000000002','ended','Ended','Ended','Your program has ended. Please check the note from the team.','#dc2626',6,NULL,true,true);

INSERT INTO public.question_bank(category,type,label,options,max_length,knockout_rule) VALUES
('commitment','yes_no','Can you commit to the full 6 month program?',NULL,NULL,'{"equals":"no"}'),
('commitment','yes_no','Can you work 3 PM to 6 PM and 8 PM to 11 PM?',NULL,NULL,'{"equals":"no"}'),
('commitment','yes_no','Are you currently working with any agency or competitor?',NULL,NULL,'{"equals":"yes"}'),
('commitment','single_choice','Where would you prefer to work?','["Office","Remote","Either"]',NULL,NULL),
('tools','multi_choice','Which AI tools have you used?','["Midjourney","Higgsfield","Kling","Seedance","Runway","ElevenLabs","Suno","Premiere Pro","After Effects","DaVinci Resolve","CapCut","Other"]',NULL,NULL),
('tools','rating','Rate your prompt writing (1 to 5)',NULL,NULL,NULL),
('tools','rating','Rate your video editing (1 to 5)',NULL,NULL,NULL),
('tools','rating','Rate your storytelling (1 to 5)',NULL,NULL,NULL),
('thinking','long_text','How would you make a 30 second ad for a local brand without a shoot? Walk us through your process.',NULL,1500,NULL),
('thinking','long_text','Name one ad or film you love and tell us why.',NULL,800,NULL),
('thinking','long_text','A client gives feedback you disagree with. What do you do?',NULL,800,NULL),
('setup','short_text','What laptop do you use (processor, RAM, GPU)?',NULL,NULL,NULL),
('setup','single_choice','How is your internet?','["Broadband","Mobile data","Both"]',NULL,NULL),
('portfolio','link','Portfolio link',NULL,NULL,NULL),
('portfolio','link','Link to your best AI work',NULL,NULL,NULL),
('portfolio','long_text','What exactly was your role in that work?',NULL,600,NULL);

INSERT INTO public.agreement_templates(id,name,job_type,version,body,key_terms,is_current) VALUES ('e1000000-0000-4000-8000-000000000003','Admakai Internship Program','internship',1,$agreement$
DRAFT FOR LEGAL REVIEW. This template is not approved legal advice and must be reviewed before use.

ADMAKAI INTERNSHIP PROGRAM AGREEMENT
Candidate: {{candidate_name}}
Position: {{job_title}}
Application ID: {{application_id}}
Date: {{date}}

1. Learning and progression
Admakai and {{candidate_name}} agree to a six month program starting on the mutually agreed start date. There is no fee for learning. The first two months focus on hands-on learning beside the team. In-house training work is part of learning and is unpaid. Candidates who perform well may progress to project-based paid client work. Admakai will identify client work clearly before it begins and agree the payment and scope with the candidate. Anyone who proves themselves within the six months will be offered a salaried team position, with salary, responsibilities and employment terms agreed separately in writing. Progress reviews will be respectful and based on demonstrated work.

2. Working arrangements
The agreed working hours are 3 PM to 6 PM and 8 PM to 11 PM, Asia/Dhaka time, on the working days agreed in writing. Remote work is allowed by agreement. Both sides will discuss reasonable availability changes promptly and in good faith.

3. Exclusivity during the program
For the six month program, the candidate agrees not to work with a competing agency or AI video studio. The candidate may ask Admakai to clarify whether a proposed outside activity creates a conflict before accepting it. This restriction ends when participation ends and is subject to applicable law.

4. Confidentiality
Both sides will respect confidential client and company information. The candidate will not share client files, unpublished materials, access details or confidential business information without written permission, and will return or securely remove such materials on request or at the end of participation. This does not prevent disclosures required by law.

5. Work ownership
Work specifically made for Admakai or its clients in this program belongs to Admakai or the relevant client, subject to applicable law and agreed paid-project terms. Pre-existing personal work and tools remain the candidate's property. Portfolio use of client or company work requires prior written approval and must respect confidentiality and third-party licences.

6. Ending the program
Either side may end the program by giving reasonable written notice. The notice period and handover will be agreed fairly in writing. No learning fee or penalty is charged for leaving. Payment already earned for agreed client work remains payable, and both sides will arrange an orderly handover. Nothing in this draft removes rights provided by applicable law.

7. Acknowledgement
Please review all key terms and ask questions before signing. A signature records acknowledgement of this draft's terms; the final legally reviewed agreement should be confirmed before operational use.

Candidate full name: {{candidate_name}}
Candidate signature: ____________________
Date: {{date}}
Application ID: {{application_id}}
For Admakai, authorised signatory: ____________________
Date: ____________________
$agreement$,'["I will not work with any competing agency or AI video studio during the 6 month program.","I will keep the agreed working hours: 3 PM to 6 PM and 8 PM to 11 PM.","I understand that in-house work during training is part of my learning and is unpaid.","I understand that any client project I work on will be paid, and I will be told which work is client work.","I will keep all client and company material confidential."]',true);

INSERT INTO public.email_templates(trigger_key,subject,body) VALUES
('application_submitted','Application received: {{job_title}}','Hi {{candidate_name}}, we received your application for {{job_title}}. {{status_message}} Track updates: {{tracker_link}}'),
('admin_new_application','New application: {{job_title}}','A new application from {{candidate_name}} for {{job_title}} is ready for review. {{status_message}} Open tracker: {{tracker_link}}'),
('in_review','Your application is in review: {{job_title}}','Hi {{candidate_name}}, our team is reviewing your application for {{job_title}}. {{status_message}} Updates: {{tracker_link}}'),
('shortlisted','You are shortlisted: {{job_title}}','Hi {{candidate_name}}, you have been shortlisted for {{job_title}}. {{status_message}} Task and next steps: {{tracker_link}}'),
('interview_scheduled','Your interview: {{job_title}}','Hi {{candidate_name}}, your interview for {{job_title}} is scheduled for {{interview_time}}. {{status_message}} Meet link: {{meet_link}} Office: {{office_address}} Details: {{tracker_link}}'),
('interview_reminder','Interview reminder: {{job_title}}','Hi {{candidate_name}}, a reminder of your {{job_title}} interview at {{interview_time}}. Meet link: {{meet_link}} Office: {{office_address}} {{status_message}} Details: {{tracker_link}}'),
('interview_rescheduled','Interview rescheduled: {{job_title}}','Hi {{candidate_name}}, your {{job_title}} interview is now at {{interview_time}}. {{status_message}} Meet link: {{meet_link}} Office: {{office_address}} Details: {{tracker_link}}'),
('rejected','Application update: {{job_title}}','Hi {{candidate_name}}, thank you for your time and interest in {{job_title}}. You were not selected this time. {{status_message}} Your tracker: {{tracker_link}}'),
('selected','You have been selected: {{job_title}}','Hi {{candidate_name}}, you have been selected for {{job_title}}. {{status_message}} Next steps: {{tracker_link}}'),
('offer','Your offer and agreement: {{job_title}}','Hi {{candidate_name}}, your offer and agreement for {{job_title}} are ready to review. {{status_message}} Review: {{tracker_link}}'),
('hired','Welcome to Admakai: {{job_title}}','Hi {{candidate_name}}, welcome to Admakai as {{job_title}}. {{status_message}} Your next steps: {{tracker_link}}'),
('journey_stage_changed','Program update: {{job_title}}','Hi {{candidate_name}}, there is an update to your {{job_title}} program. {{status_message}} View your journey: {{tracker_link}}');
INSERT INTO public.hiring_settings(id,from_email) VALUES(true,'careers@admakai.com');

ALTER PUBLICATION supabase_realtime ADD TABLE public.applications,public.application_events,public.member_journeys,public.journey_events,public.journey_milestones;

-- Regression assertions for concrete seeded terms, grants, view projection and untouched legacy definitions.
DO $$ BEGIN
 IF (SELECT count(*) FROM public.pipelines)<>2 OR (SELECT count(*) FROM public.pipeline_stages)<>17 OR (SELECT count(*) FROM public.question_bank)<>16 OR (SELECT count(*) FROM public.email_templates)<>12 THEN RAISE EXCEPTION 'Hiring seed counts failed'; END IF;
 IF (SELECT expected_days FROM public.pipeline_stages WHERE pipeline_id='e1000000-0000-4000-8000-000000000001' AND key='submitted')<>2 THEN RAISE EXCEPTION 'Submitted timing failed'; END IF;
 IF (SELECT expected_days FROM public.pipeline_stages WHERE pipeline_id='e1000000-0000-4000-8000-000000000002' AND key='learner')<>60 OR (SELECT expected_days FROM public.pipeline_stages WHERE pipeline_id='e1000000-0000-4000-8000-000000000002' AND key='project')<>120 THEN RAISE EXCEPTION 'Journey durations failed'; END IF;
 IF (SELECT from_email FROM public.hiring_settings) IS DISTINCT FROM 'careers@admakai.com' THEN RAISE EXCEPTION 'Hiring sender failed'; END IF;
 IF (SELECT jsonb_array_length(key_terms) FROM public.agreement_templates WHERE id='e1000000-0000-4000-8000-000000000003')<>5 THEN RAISE EXCEPTION 'Agreement acknowledgements failed'; END IF;
 IF has_column_privilege('authenticated','public.applications','status_key','UPDATE') OR has_column_privilege('authenticated','public.applications','is_draft','UPDATE') OR has_table_privilege('authenticated','public.signed_agreements','INSERT') OR has_table_privilege('anon','public.candidates','SELECT') THEN RAISE EXCEPTION 'Least privilege grant failed'; END IF;
 IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='candidate_interviews' AND column_name IN ('result_score','strengths','concerns','recommendation','interviewer_id')) THEN RAISE EXCEPTION 'Interview view exposes assessments'; END IF;
 IF EXISTS(SELECT 1 FROM storage.buckets WHERE id IN ('resumes','signatures','agreements','letters','task-files') AND public) OR (SELECT count(*) FROM storage.buckets WHERE id IN ('resumes','signatures','agreements','letters','task-files'))<>5 THEN RAISE EXCEPTION 'Private hiring bucket assertion failed'; END IF;
END $$;

-- All regression fixtures below live inside an exception subtransaction and are rolled back.
DO $tests$
DECLARE ca uuid:='e2000000-0000-4000-8000-000000000001'; cb uuid:='e2000000-0000-4000-8000-000000000002'; ad uuid:='e2000000-0000-4000-8000-000000000003'; rv uuid:='e2000000-0000-4000-8000-000000000004'; iv uuid:='e2000000-0000-4000-8000-000000000005'; iv2 uuid:='e2000000-0000-4000-8000-000000000006'; jid uuid:='e2000000-0000-4000-8000-000000000007'; aid uuid:='e2000000-0000-4000-8000-000000000008'; bid uuid:='e2000000-0000-4000-8000-000000000009'; qid uuid:='e2000000-0000-4000-8000-000000000010'; interview_id uuid:='e2000000-0000-4000-8000-000000000011'; journey_id uuid:='e2000000-0000-4000-8000-000000000012'; n int;
BEGIN
 BEGIN
  INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES(ca,'hiring-regression-a@example.invalid','{}'),(cb,'hiring-regression-b@example.invalid','{}'),(ad,'hiring-regression-admin@example.invalid','{}'),(rv,'hiring-regression-reviewer@example.invalid','{}'),(iv,'hiring-regression-interviewer@example.invalid','{}'),(iv2,'hiring-regression-interviewer2@example.invalid','{}');
  INSERT INTO public.candidates(id,full_name) VALUES(ca,'Regression A'),(cb,'Regression B');
  INSERT INTO public.hiring_user_roles(user_id,role) VALUES(ad,'admin'),(rv,'reviewer'),(iv,'interviewer'),(iv2,'interviewer');
  INSERT INTO public.jobs(id,slug,title,type,work_mode,status,application_pipeline_id,journey_pipeline_id,agreement_template_id) VALUES(jid,'hiring-regression-only','Regression job','internship','remote','open','e1000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000002','e1000000-0000-4000-8000-000000000003');
  INSERT INTO public.job_questions(id,job_id,label_override,type,required) VALUES(qid,jid,'Required regression answer','short_text',true);
  INSERT INTO public.applications(id,job_id,candidate_id) VALUES(aid,jid,ca),(bid,jid,cb);
  IF (SELECT public_code FROM public.applications WHERE id=aid) !~ '^ADM-[0-9]{4}-[0-9]{4,}$' THEN RAISE EXCEPTION 'Application code format failed'; END IF;
  INSERT INTO public.interviews(id,application_id,scheduled_at,mode,interviewer_id,result_score,strengths,concerns,recommendation) VALUES(interview_id,aid,now(),'meet',iv,5,'private strengths','private concerns','select');
  INSERT INTO public.application_reviews(application_id,reviewer_id,skill_score) VALUES(aid,rv,5);
  INSERT INTO public.internal_notes(application_id,author_id,body) VALUES(aid,rv,'private note');
  INSERT INTO public.application_events(application_id,to_status,visible_to_candidate) VALUES(aid,'draft',false);
  INSERT INTO public.member_journeys(id,application_id,candidate_id,job_id,pipeline_id,stage_key) VALUES(journey_id,aid,ca,jid,'e1000000-0000-4000-8000-000000000002','onboarding');
  PERFORM set_config('request.jwt.claim.sub',ca::text,true); PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',ca,'role','authenticated')::text,true);
  SET LOCAL ROLE authenticated;
  IF (SELECT count(*) FROM public.candidates)<>1 OR (SELECT count(*) FROM public.applications)<>1 THEN RAISE EXCEPTION 'Candidate isolation failed'; END IF;
  IF EXISTS(SELECT 1 FROM public.application_reviews) OR EXISTS(SELECT 1 FROM public.internal_notes) OR EXISTS(SELECT 1 FROM public.interviews) OR EXISTS(SELECT 1 FROM public.application_events) OR EXISTS(SELECT 1 FROM public.email_log) THEN RAISE EXCEPTION 'Candidate private assessment denial failed'; END IF;
  IF (SELECT count(*) FROM public.candidate_interviews)<>1 THEN RAISE EXCEPTION 'Candidate safe interview read failed'; END IF;
  IF public.hiring_storage_path_owned(cb::text||'/'||bid::text||'/cv.pdf') OR public.hiring_storage_path_owned(ca::text||'/'||bid::text||'/cv.pdf') OR NOT public.hiring_storage_path_owned(ca::text||'/'||aid::text||'/cv.pdf') THEN RAISE EXCEPTION 'Storage ownership failed'; END IF;
  BEGIN UPDATE public.applications SET status_key='hired' WHERE id=aid; RAISE EXCEPTION 'Direct candidate status update allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN INSERT INTO public.hiring_user_roles(user_id,role) VALUES(ca,'admin'); RAISE EXCEPTION 'Candidate role escalation allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.change_application_status(aid,'hired',NULL,NULL); RAISE EXCEPTION 'Candidate staff RPC allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.submit_application(aid); RAISE EXCEPTION 'Missing required answer submission allowed'; EXCEPTION WHEN check_violation THEN NULL; END;
  INSERT INTO public.application_answers(application_id,job_question_id,answer) VALUES(aid,qid,'"Ready"');
  BEGIN PERFORM public.submit_application(aid); RAISE EXCEPTION 'Missing agreement submission allowed'; EXCEPTION WHEN check_violation THEN NULL; END;
  RESET ROLE;
  INSERT INTO public.signed_agreements(application_id,template_id,template_version,signer_full_name,signature_path,pdf_path,pdf_sha256,accepted_terms) SELECT aid,id,version,'Regression A',ca::text||'/'||aid::text||'/signature.png',ca::text||'/'||aid::text||'/agreement.pdf',repeat('a',64),key_terms FROM public.agreement_templates WHERE id='e1000000-0000-4000-8000-000000000003';
  SET LOCAL ROLE authenticated;
  PERFORM public.submit_application(aid);
  IF (SELECT is_draft OR status_key<>'submitted' OR submitted_at IS NULL FROM public.applications WHERE id=aid) THEN RAISE EXCEPTION 'Atomic submission state failed'; END IF;
  UPDATE public.application_answers SET answer='"Changed after submit"' WHERE application_id=aid; GET DIAGNOSTICS n=ROW_COUNT; IF n<>0 THEN RAISE EXCEPTION 'Post-submit answers changed'; END IF;
  UPDATE public.applications SET current_step=2 WHERE id=aid; GET DIAGNOSTICS n=ROW_COUNT; IF n<>0 THEN RAISE EXCEPTION 'Post-submit application changed'; END IF;
  BEGIN PERFORM public.submit_application(aid); RAISE EXCEPTION 'Duplicate submission allowed'; EXCEPTION WHEN check_violation THEN NULL; END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub',cb::text,true); PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',cb,'role','authenticated')::text,true); SET LOCAL ROLE authenticated;
  IF EXISTS(SELECT 1 FROM public.candidate_interviews) OR EXISTS(SELECT 1 FROM public.signed_agreements) OR EXISTS(SELECT 1 FROM public.member_journeys) THEN RAISE EXCEPTION 'Cross-candidate view or document leak'; END IF;
  BEGIN PERFORM public.submit_application(aid); RAISE EXCEPTION 'Other candidate submitted application'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub',ad::text,true); PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',ad,'role','authenticated')::text,true); SET LOCAL ROLE authenticated;
  BEGIN PERFORM public.change_application_status(aid,'not-a-stage',NULL,NULL); RAISE EXCEPTION 'Unknown stage accepted'; EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN PERFORM public.change_application_status(aid,'rejected',NULL,' '); RAISE EXCEPTION 'Negative stage missing reason accepted'; EXCEPTION WHEN check_violation THEN NULL; END;
  PERFORM public.change_application_status(aid,'in_review','Reviewing your application',NULL);
  PERFORM public.change_application_status(aid,'rejected','Thank you','Not selected in this round');
  BEGIN PERFORM public.change_journey_stage(journey_id,'ended',' ',true); RAISE EXCEPTION 'Negative journey stage missing note accepted'; EXCEPTION WHEN check_violation THEN NULL; END;
  PERFORM public.change_journey_stage(journey_id,'learner','Learning started',true);
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub',rv::text,true); PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',rv,'role','authenticated')::text,true); SET LOCAL ROLE authenticated;
  INSERT INTO public.internal_notes(application_id,author_id,body) VALUES(aid,rv,'Reviewer can write');
  INSERT INTO public.application_reviews(application_id,reviewer_id,thinking_score) VALUES(aid,rv,4);
  BEGIN INSERT INTO public.jobs(slug,title,type,work_mode,application_pipeline_id) VALUES('reviewer-forbidden','No','internship','remote','e1000000-0000-4000-8000-000000000001'); RAISE EXCEPTION 'Reviewer created job'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub',iv::text,true); PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',iv,'role','authenticated')::text,true); SET LOCAL ROLE authenticated;
  UPDATE public.interviews SET status='done',result_score=4 WHERE id=interview_id; GET DIAGNOSTICS n=ROW_COUNT; IF n<>1 THEN RAISE EXCEPTION 'Assigned interviewer update denied'; END IF;
  BEGIN UPDATE public.interviews SET interviewer_id=iv2 WHERE id=interview_id; RAISE EXCEPTION 'Interviewer reassigned interview'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub',iv2::text,true); PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',iv2,'role','authenticated')::text,true); SET LOCAL ROLE authenticated;
  IF EXISTS(SELECT 1 FROM public.interviews) THEN RAISE EXCEPTION 'Unassigned interviewer read allowed'; END IF;
  UPDATE public.interviews SET status='cancelled' WHERE id=interview_id; GET DIAGNOSTICS n=ROW_COUNT; IF n<>0 THEN RAISE EXCEPTION 'Unassigned interviewer update allowed'; END IF;
  RESET ROLE;
  BEGIN UPDATE public.agreement_templates SET body='changed' WHERE id='e1000000-0000-4000-8000-000000000003'; RAISE EXCEPTION 'Template mutation allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN UPDATE public.signed_agreements SET signer_full_name='changed' WHERE application_id=aid; RAISE EXCEPTION 'Signed agreement mutation allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN INSERT INTO public.application_reviews(application_id,reviewer_id,skill_score) VALUES(aid,rv,6); RAISE EXCEPTION 'Score above 5 allowed'; EXCEPTION WHEN check_violation THEN NULL; END;
  PERFORM set_config('request.jwt.claim.sub','',true); PERFORM set_config('request.jwt.claims','{"role":"anon"}',true); SET LOCAL ROLE anon;
  IF (SELECT count(*) FROM public.jobs)<>1 OR (SELECT count(*) FROM public.job_questions)<>1 OR (SELECT count(*) FROM public.pipeline_stages)<>17 OR (SELECT count(*) FROM public.agreement_templates)<>1 THEN RAISE EXCEPTION 'Anonymous public reads failed'; END IF;
  BEGIN PERFORM 1 FROM public.applications; RAISE EXCEPTION 'Anonymous private read allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RESET ROLE;
  RAISE EXCEPTION 'hiring_regression_rollback' USING ERRCODE='Z0001';
 EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL;
 END;
 IF EXISTS(SELECT 1 FROM auth.users WHERE id IN (ca,cb,ad,rv,iv,iv2)) OR EXISTS(SELECT 1 FROM public.applications WHERE id IN (aid,bid)) THEN RAISE EXCEPTION 'Regression fixtures were not rolled back'; END IF;
END $tests$;

DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM hiring_existing_objects_before b LEFT JOIN (
 SELECT 'function' AS kind,p.oid AS object_id,pg_get_functiondef(p.oid)||coalesce(p.proacl::text,'') AS definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','app') AND p.prokind='f'
 UNION ALL SELECT 'policy',p.oid,p.polname||coalesce(pg_get_expr(p.polqual,p.polrelid),'')||coalesce(pg_get_expr(p.polwithcheck,p.polrelid),'')||p.polroles::text||p.polcmd::text FROM pg_policy p
 UNION ALL SELECT 'table',c.oid,c.relname||coalesce(c.relacl::text,'')||c.relrowsecurity::text||coalesce((SELECT string_agg(a.attname||':'||format_type(a.atttypid,a.atttypmod)||':'||a.attnotnull::text,',' ORDER BY a.attnum) FROM pg_attribute a WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped),'') FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r'
 UNION ALL SELECT 'trigger',t.oid,pg_get_triggerdef(t.oid) FROM pg_trigger t WHERE NOT t.tgisinternal
 ) after_objects USING(kind,object_id) WHERE after_objects.definition IS DISTINCT FROM b.definition) THEN RAISE EXCEPTION 'An existing object changed; aborting hiring migration'; END IF;
 IF EXISTS(SELECT 1 FROM hiring_existing_buckets_before b WHERE NOT EXISTS(SELECT 1 FROM storage.buckets s WHERE to_jsonb(s)=b.definition)) THEN RAISE EXCEPTION 'An existing bucket changed'; END IF;
END $$;