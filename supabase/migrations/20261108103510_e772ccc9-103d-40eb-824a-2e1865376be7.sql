ALTER FUNCTION public.hiring_profile_access(uuid) SET SCHEMA hiring_private;
CREATE FUNCTION public.hiring_profile_access(_candidate uuid) RETURNS boolean LANGUAGE sql STABLE SET search_path='' AS $$ SELECT hiring_private.hiring_profile_access(_candidate) $$;
REVOKE ALL ON FUNCTION public.hiring_profile_access(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.hiring_profile_access(uuid) TO authenticated,service_role;
CREATE POLICY hiring6_applications_scope ON public.applications AS RESTRICTIVE FOR SELECT TO authenticated USING(candidate_id=auth.uid() OR public.hiring_profile_access(candidate_id));
CREATE POLICY hiring6_candidates_scope ON public.candidates AS RESTRICTIVE FOR SELECT TO authenticated USING(id=auth.uid() OR public.hiring_profile_access(id));
CREATE POLICY hiring6_answers_scope ON public.application_answers AS RESTRICTIVE FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.applications a WHERE a.id=application_id));
CREATE POLICY hiring6_events_scope ON public.application_events AS RESTRICTIVE FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.applications a WHERE a.id=application_id));
CREATE POLICY hiring6_reviews_scope ON public.application_reviews AS RESTRICTIVE FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.applications a WHERE a.id=application_id));
CREATE POLICY hiring6_notes_scope ON public.internal_notes AS RESTRICTIVE FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.applications a WHERE a.id=application_id));
CREATE POLICY hiring6_signed_scope ON public.signed_agreements AS RESTRICTIVE FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.applications a WHERE a.id=application_id));
CREATE POLICY hiring6_documents_scope ON public.documents AS RESTRICTIVE FOR SELECT TO authenticated USING(candidate_id=auth.uid() OR public.hiring_profile_access(candidate_id));
CREATE FUNCTION hiring_private.list_hiring_staff() RETURNS TABLE(user_id uuid,email text,roles text[]) LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT r.user_id,p.email,array_agg(r.role::text ORDER BY r.role::text) FROM public.hiring_user_roles r JOIN public.profiles p ON p.user_id=r.user_id WHERE public.is_hiring_staff(auth.uid()) GROUP BY r.user_id,p.email $$;
REVOKE ALL ON FUNCTION hiring_private.list_hiring_staff() FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION hiring_private.list_hiring_staff() TO authenticated,service_role;
CREATE FUNCTION public.list_hiring_staff() RETURNS TABLE(user_id uuid,email text,roles text[]) LANGUAGE sql STABLE SET search_path='' AS $$ SELECT * FROM hiring_private.list_hiring_staff() $$;
REVOKE ALL ON FUNCTION public.list_hiring_staff() FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.list_hiring_staff() TO authenticated,service_role;
CREATE FUNCTION public.hiring6_transition_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE ceiling int; target int; BEGIN
 IF NEW.status_key IS NOT DISTINCT FROM OLD.status_key OR auth.role()='service_role' OR auth.uid() IS NULL OR NOT public.is_hiring_staff(auth.uid()) THEN RETURN NEW; END IF;
 IF public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
 IF public.has_role(auth.uid(),'reviewer') THEN
 SELECT s.sort_order INTO ceiling FROM public.pipeline_stages s JOIN public.jobs j ON j.application_pipeline_id=s.pipeline_id WHERE j.id=NEW.job_id AND s.key='interview_done';
 SELECT s.sort_order INTO target FROM public.pipeline_stages s JOIN public.jobs j ON j.application_pipeline_id=s.pipeline_id WHERE j.id=NEW.job_id AND s.key=NEW.status_key;
 IF ceiling IS NULL OR target IS NULL OR target>ceiling THEN RAISE EXCEPTION 'Reviewers may move only through interview_done' USING ERRCODE='42501'; END IF; RETURN NEW;
 END IF;
 IF NEW.status_key='interview_done' AND current_setting('hiring6.result',true)=NEW.id::text AND EXISTS(SELECT 1 FROM public.interviews WHERE application_id=NEW.id AND interviewer_id=auth.uid()) THEN RETURN NEW; END IF;
 RAISE EXCEPTION 'Interviewers may only record their assigned interview result' USING ERRCODE='42501'; END $$;
CREATE TRIGGER hiring6_transition_guard BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.hiring6_transition_guard();
REVOKE ALL ON FUNCTION public.hiring6_transition_guard() FROM PUBLIC,anon,authenticated;
CREATE FUNCTION hiring_private.schedule_interview(_application_id uuid,_scheduled_at timestamptz,_duration_minutes int,_mode text,_meet_link text,_office_address text,_interviewer_id uuid,_message text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE result uuid; BEGIN
 IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'reviewer')) THEN RAISE EXCEPTION 'Hiring admin or reviewer required' USING ERRCODE='42501'; END IF;
 IF _scheduled_at<=now() OR _duration_minutes NOT BETWEEN 5 AND 240 OR _mode NOT IN ('meet','office') OR (_mode='meet' AND coalesce(_meet_link,'') !~ '^https://meet.google.com/') OR (_mode='office' AND coalesce(btrim(_office_address),'')='') THEN RAISE EXCEPTION 'Valid future interview time, duration and location required'; END IF;
 IF NOT public.has_role(_interviewer_id,'interviewer') AND NOT public.has_role(_interviewer_id,'admin') THEN RAISE EXCEPTION 'Choose a hiring interviewer'; END IF;
 PERFORM 1 FROM public.applications WHERE id=_application_id AND NOT is_draft FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Submitted application required'; END IF;
 IF EXISTS(SELECT 1 FROM public.interviews WHERE application_id=_application_id AND status IN ('scheduled','rescheduled')) THEN RAISE EXCEPTION 'Reschedule the existing interview'; END IF;
 INSERT INTO public.interviews(application_id,scheduled_at,duration_minutes,mode,meet_link,office_address,interviewer_id) VALUES(_application_id,_scheduled_at,_duration_minutes,_mode,_meet_link,_office_address,_interviewer_id) RETURNING id INTO result;
 PERFORM public.change_application_status(_application_id,'interview_scheduled',_message,''); RETURN result; END $$;
CREATE FUNCTION public.schedule_interview(_application_id uuid,_scheduled_at timestamptz,_duration_minutes int,_mode text,_meet_link text,_office_address text,_interviewer_id uuid,_message text) RETURNS uuid LANGUAGE sql SET search_path='' AS $$ SELECT hiring_private.schedule_interview(_application_id,_scheduled_at,_duration_minutes,_mode,_meet_link,_office_address,_interviewer_id,_message) $$;
CREATE FUNCTION hiring_private.reschedule_interview(_interview_id uuid,_scheduled_at timestamptz,_message text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE i public.interviews; BEGIN
 SELECT * INTO i FROM public.interviews WHERE id=_interview_id FOR UPDATE;
 IF NOT FOUND OR NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'reviewer') OR (public.has_role(auth.uid(),'interviewer') AND i.interviewer_id=auth.uid())) THEN RAISE EXCEPTION 'Interview access required' USING ERRCODE='42501'; END IF;
 IF _scheduled_at<=now() OR i.status NOT IN ('scheduled','rescheduled') THEN RAISE EXCEPTION 'Active interview and future time required'; END IF;
 UPDATE public.interviews SET scheduled_at=_scheduled_at,status='rescheduled',reminder_sent_at=NULL WHERE id=i.id;
 INSERT INTO public.application_events(application_id,from_status,to_status,message_to_candidate,created_by) VALUES(i.application_id,'interview_scheduled','interview_scheduled',_message,auth.uid()); RETURN i.id; END $$;
CREATE FUNCTION public.reschedule_interview(_interview_id uuid,_scheduled_at timestamptz,_message text) RETURNS uuid LANGUAGE sql SET search_path='' AS $$ SELECT hiring_private.reschedule_interview(_interview_id,_scheduled_at,_message) $$;
CREATE FUNCTION hiring_private.cancel_interview(_interview_id uuid,_reason text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE i public.interviews; BEGIN
 SELECT * INTO i FROM public.interviews WHERE id=_interview_id FOR UPDATE;
 IF NOT FOUND OR NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'reviewer') OR (public.has_role(auth.uid(),'interviewer') AND i.interviewer_id=auth.uid())) THEN RAISE EXCEPTION 'Interview access required' USING ERRCODE='42501'; END IF;
 IF coalesce(btrim(_reason),'')='' OR i.status NOT IN ('scheduled','rescheduled') THEN RAISE EXCEPTION 'Active interview and cancellation reason required'; END IF;
 UPDATE public.interviews SET status='cancelled' WHERE id=i.id;
 INSERT INTO public.application_events(application_id,from_status,to_status,message_to_candidate,reason,created_by) VALUES(i.application_id,'interview_scheduled','interview_scheduled','Your interview was cancelled. '||_reason,_reason,auth.uid()); RETURN i.id; END $$;
CREATE FUNCTION public.cancel_interview(_interview_id uuid,_reason text) RETURNS uuid LANGUAGE sql SET search_path='' AS $$ SELECT hiring_private.cancel_interview(_interview_id,_reason) $$;
CREATE FUNCTION hiring_private.save_interview_result(_interview_id uuid,_score int,_strengths text,_concerns text,_recommendation text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE i public.interviews; BEGIN
 SELECT * INTO i FROM public.interviews WHERE id=_interview_id FOR UPDATE;
 IF NOT FOUND OR NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'reviewer') OR (public.has_role(auth.uid(),'interviewer') AND i.interviewer_id=auth.uid())) THEN RAISE EXCEPTION 'Interview access required' USING ERRCODE='42501'; END IF;
 IF _score NOT BETWEEN 1 AND 5 OR _recommendation NOT IN ('select','reject','another_round') OR i.status='cancelled' THEN RAISE EXCEPTION 'Valid score and recommendation required'; END IF;
 UPDATE public.interviews SET result_score=_score,strengths=_strengths,concerns=_concerns,recommendation=_recommendation,status='done' WHERE id=i.id;
 PERFORM set_config('hiring6.result',i.application_id::text,true);
 IF EXISTS(SELECT 1 FROM public.applications WHERE id=i.application_id AND status_key<>'interview_done') THEN PERFORM public.change_application_status(i.application_id,'interview_done','Your interview has been completed.',''); END IF; RETURN i.id; END $$;
CREATE FUNCTION public.save_interview_result(_interview_id uuid,_score int,_strengths text,_concerns text,_recommendation text) RETURNS uuid LANGUAGE sql SET search_path='' AS $$ SELECT hiring_private.save_interview_result(_interview_id,_score,_strengths,_concerns,_recommendation) $$;
DO $$ DECLARE f record; BEGIN FOR f IN SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','hiring_private') AND p.proname IN ('schedule_interview','reschedule_interview','cancel_interview','save_interview_result') LOOP EXECUTE 'REVOKE ALL ON FUNCTION '||f.signature||' FROM PUBLIC,anon'; EXECUTE 'GRANT EXECUTE ON FUNCTION '||f.signature||' TO authenticated,service_role'; END LOOP; END $$;
INSERT INTO public.email_templates(trigger_key,subject,body,is_enabled) VALUES ('interview_rescheduled','Your Admakai interview has been rescheduled','Hello {{candidate_name}},\n{{status_message}}\n{{interview_details}}',true),('interview_cancelled','Your Admakai interview has been cancelled','Hello {{candidate_name}},\n{{status_message}}',true),('interview_reminder','Reminder: your Admakai interview','Hello {{candidate_name}},\n{{interview_details}}\nWe look forward to meeting you.',true) ON CONFLICT(trigger_key) DO NOTHING;