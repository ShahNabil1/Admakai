CREATE TABLE public.clients (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 profile_id uuid UNIQUE REFERENCES public.profiles(user_id),
 brand_name text, website text, whatsapp text,
 is_customer boolean NOT NULL DEFAULT false,
 notes text, owner_id uuid REFERENCES public.profiles(user_id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.clients FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY clients_read ON public.clients FOR SELECT TO authenticated USING ((SELECT app.is_staff()) OR profile_id=(SELECT auth.uid()));
CREATE POLICY clients_create ON public.clients FOR INSERT TO authenticated WITH CHECK ((SELECT app.is_manager()));
CREATE POLICY clients_edit ON public.clients FOR UPDATE TO authenticated USING ((SELECT app.is_manager())) WITH CHECK ((SELECT app.is_manager()));

CREATE FUNCTION app.my_client_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT id FROM public.clients WHERE profile_id=(SELECT auth.uid())
$$;
REVOKE ALL ON FUNCTION app.my_client_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app.my_client_id() TO authenticated, service_role;

CREATE TABLE public.activity (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), entity_type text NOT NULL, entity_id uuid NOT NULL,
 actor_id uuid REFERENCES public.profiles(user_id), verb text NOT NULL,
 from_value text, to_value text, meta jsonb DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.activity FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.activity TO authenticated;
GRANT SELECT, INSERT ON public.activity TO service_role;
ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY activity_read ON public.activity FOR SELECT TO authenticated USING ((SELECT app.is_staff()));
CREATE POLICY activity_append ON public.activity FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND actor_id IS NOT DISTINCT FROM (SELECT auth.uid()));
CREATE INDEX activity_entity_history_idx ON public.activity(entity_type, entity_id, created_at DESC);
CREATE FUNCTION public.reject_activity_mutation() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN RAISE EXCEPTION 'Activity history is append only' USING ERRCODE='42501'; END;
$$;
REVOKE ALL ON FUNCTION public.reject_activity_mutation() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER activity_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON public.activity FOR EACH STATEMENT EXECUTE FUNCTION public.reject_activity_mutation();

CREATE TABLE public.leads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
 booking_id uuid, stage public.lead_stage NOT NULL DEFAULT 'new', owner_id uuid REFERENCES public.profiles(user_id),
 value_estimate bigint, currency text DEFAULT 'BDT', lost_reason_category text, lost_reason text,
 reopened_from uuid REFERENCES public.leads(id), source jsonb DEFAULT '{}'::jsonb,
 stage_changed_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.leads FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY leads_read ON public.leads FOR SELECT TO authenticated USING ((SELECT app.is_staff()));
CREATE POLICY leads_create ON public.leads FOR INSERT TO authenticated WITH CHECK ((SELECT app.is_staff()) AND (SELECT app.is_manager()));
CREATE POLICY leads_edit ON public.leads FOR UPDATE TO authenticated USING ((SELECT app.is_staff())) WITH CHECK ((SELECT app.is_staff()) AND ((SELECT app.is_manager()) OR owner_id=(SELECT auth.uid())));
CREATE POLICY leads_remove ON public.leads FOR DELETE TO authenticated USING ((SELECT app.is_staff()) AND (SELECT app.is_manager()));
CREATE INDEX leads_stage_changed_idx ON public.leads(stage, stage_changed_at);
CREATE INDEX leads_client_idx ON public.leads(client_id);
CREATE FUNCTION public.guard_lead_owner_update() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF current_user IN ('anon','authenticated') AND NOT app.is_manager() THEN
  IF NOT app.is_staff() OR NEW.owner_id IS DISTINCT FROM auth.uid()
     OR (to_jsonb(NEW)-'owner_id') IS DISTINCT FROM (to_jsonb(OLD)-'owner_id') THEN
   RAISE EXCEPTION 'Staff may only assign a lead to themselves' USING ERRCODE='42501';
  END IF;
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_lead_owner_update() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER a_leads_owner_guard BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.guard_lead_owner_update();

CREATE TABLE public.bookings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
 lead_id uuid REFERENCES public.leads(id), slot_at timestamptz NOT NULL,
 duration_minutes integer NOT NULL DEFAULT 30, status public.booking_status NOT NULL DEFAULT 'requested',
 owner_id uuid REFERENCES public.profiles(user_id), meet_link text, brief jsonb NOT NULL DEFAULT '{}'::jsonb, budget_band text,
 source jsonb DEFAULT '{}'::jsonb, reschedule_count integer NOT NULL DEFAULT 0,
 notes_shared text, notes_internal text, recording_url text, reminder_24_sent_at timestamptz, reminder_1_sent_at timestamptz,
 completed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.bookings FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY bookings_read ON public.bookings FOR SELECT TO authenticated USING ((SELECT app.is_staff()) OR client_id=(SELECT app.my_client_id()));
CREATE POLICY bookings_request ON public.bookings FOR INSERT TO authenticated WITH CHECK (client_id=(SELECT app.my_client_id()));
CREATE POLICY bookings_edit ON public.bookings FOR UPDATE TO authenticated USING ((SELECT app.is_manager()) OR ((SELECT app.is_staff()) AND owner_id=(SELECT auth.uid()))) WITH CHECK ((SELECT app.is_manager()) OR ((SELECT app.is_staff()) AND owner_id=(SELECT auth.uid())));
CREATE UNIQUE INDEX bookings_unique_active_slot_idx ON public.bookings(slot_at) WHERE status NOT IN ('cancelled','rescheduled');
CREATE INDEX bookings_client_idx ON public.bookings(client_id);
ALTER TABLE public.leads ADD CONSTRAINT leads_booking_id_fkey FOREIGN KEY(booking_id) REFERENCES public.bookings(id);
CREATE FUNCTION public.guard_booking_request() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF current_user IN ('anon','authenticated') AND NOT app.is_staff() THEN
  IF NEW.status<>'requested' OR NEW.owner_id IS NOT NULL OR NEW.lead_id IS NOT NULL OR NEW.meet_link IS NOT NULL
    OR NEW.notes_internal IS NOT NULL OR NEW.recording_url IS NOT NULL OR NEW.reschedule_count<>0
    OR NEW.reminder_24_sent_at IS NOT NULL OR NEW.reminder_1_sent_at IS NOT NULL OR NEW.completed_at IS NOT NULL THEN
   RAISE EXCEPTION 'Clients may only request a new booking' USING ERRCODE='42501';
  END IF;
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_booking_request() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER bookings_request_guard BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.guard_booking_request();

CREATE TABLE public.booking_files (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
 storage_path text NOT NULL, original_name text, bytes bigint, mime text, created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.booking_files FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.booking_files TO authenticated;
GRANT ALL ON public.booking_files TO service_role;
ALTER TABLE public.booking_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY booking_files_read ON public.booking_files FOR SELECT TO authenticated USING ((SELECT app.is_staff()) OR EXISTS (SELECT 1 FROM public.bookings b WHERE b.id=booking_files.booking_id AND b.client_id=(SELECT app.my_client_id())));
CREATE INDEX booking_files_booking_idx ON public.booking_files(booking_id);
CREATE TRIGGER clients_touch_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER leads_touch_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER bookings_touch_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE FUNCTION public.audit_lead_stage() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.stage IS DISTINCT FROM OLD.stage THEN
  NEW.stage_changed_at := now();
  INSERT INTO public.activity(entity_type,entity_id,actor_id,verb,from_value,to_value)
  VALUES('lead',NEW.id,auth.uid(),'stage_changed',OLD.stage::text,NEW.stage::text);
 ELSE NEW.stage_changed_at := OLD.stage_changed_at;
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.audit_lead_stage() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER b_leads_stage_audit BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.audit_lead_stage();

-- Rollback-only behavioral tests; synthetic rows never persist.
DO $$
DECLARE
 u uuid:=gen_random_uuid(); other_u uuid:=gen_random_uuid(); staff_u uuid:=gen_random_uuid(); manager_u uuid:=gen_random_uuid();
 c uuid:=gen_random_uuid(); other_c uuid:=gen_random_uuid(); l uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); other_b uuid:=gen_random_uuid();
 n integer; t timestamptz; audit_id uuid:=gen_random_uuid(); slot timestamptz:='2098-01-01 10:00:00+00';
BEGIN
 BEGIN
  INSERT INTO auth.users(id,email) VALUES(u,'booking-client@example.invalid'),(other_u,'booking-other@example.invalid'),(staff_u,'booking-staff@example.invalid'),(manager_u,'booking-manager@example.invalid');
  UPDATE public.user_roles SET role='member' WHERE user_id=staff_u;
  UPDATE public.user_roles SET role='manager' WHERE user_id=manager_u;
  INSERT INTO public.clients(id,profile_id) VALUES(c,u),(other_c,other_u);
  INSERT INTO public.leads(id,client_id,stage_changed_at) VALUES(l,c,'2000-01-01');
  INSERT INTO public.bookings(id,client_id,slot_at,owner_id) VALUES(b,c,slot,staff_u),(other_b,other_c,slot+interval '1 hour',manager_u);
  INSERT INTO public.booking_files(booking_id,storage_path) VALUES(b,'test/own.jpg'),(other_b,'test/other.jpg');
  BEGIN
   INSERT INTO public.bookings(client_id,slot_at) VALUES(c,slot);
   RAISE EXCEPTION 'Duplicate active slot allowed';
  EXCEPTION WHEN unique_violation THEN NULL; END;
  UPDATE public.bookings SET status='cancelled' WHERE id=b;
  INSERT INTO public.bookings(client_id,slot_at,status) VALUES(c,slot,'rescheduled');
  UPDATE public.bookings SET status='requested' WHERE id=b;
  IF NOT EXISTS(SELECT 1 FROM public.bookings WHERE id=b AND duration_minutes=30) THEN RAISE EXCEPTION 'Booking duration default failed'; END IF;
  PERFORM set_config('request.jwt.claim.sub',u::text,true);
  SET LOCAL ROLE authenticated;
  IF app.my_client_id() IS DISTINCT FROM c THEN RAISE EXCEPTION 'Client lookup failed'; END IF;
  SELECT count(*) INTO n FROM public.clients WHERE id IN(c,other_c);
  IF n<>1 THEN RAISE EXCEPTION 'Client record visibility failed'; END IF;
  SELECT count(*) INTO n FROM public.leads WHERE id=l;
  IF n<>0 THEN RAISE EXCEPTION 'Lead leaked to client'; END IF;
  SELECT count(*) INTO n FROM public.bookings WHERE id IN(b,other_b);
  IF n<>1 THEN RAISE EXCEPTION 'Booking visibility failed'; END IF;
  SELECT count(*) INTO n FROM public.booking_files WHERE booking_id IN(b,other_b);
  IF n<>1 THEN RAISE EXCEPTION 'Booking file visibility failed'; END IF;
  INSERT INTO public.bookings(client_id,slot_at) VALUES(c,slot+interval '3 hours');
  BEGIN
   INSERT INTO public.bookings(client_id,slot_at) VALUES(other_c,slot+interval '4 hours');
   RAISE EXCEPTION 'Client requested another client booking';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
   INSERT INTO public.bookings(client_id,slot_at,owner_id) VALUES(c,slot+interval '4 hours',u);
   RAISE EXCEPTION 'Client forged booking owner';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  UPDATE public.bookings SET status='confirmed' WHERE id=b;
  GET DIAGNOSTICS n=ROW_COUNT;
  IF n<>0 THEN RAISE EXCEPTION 'Client edited booking'; END IF;
  INSERT INTO public.activity(id,entity_type,entity_id,actor_id,verb) VALUES(audit_id,'booking',b,u,'requested');
  SELECT count(*) INTO n FROM public.activity WHERE id=audit_id;
  IF n<>0 THEN RAISE EXCEPTION 'Activity leaked to client'; END IF;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub',staff_u::text,true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO n FROM public.clients WHERE id IN(c,other_c);
  IF n<>2 THEN RAISE EXCEPTION 'Staff client visibility failed'; END IF;
  UPDATE public.leads SET owner_id=staff_u WHERE id=l;
  GET DIAGNOSTICS n=ROW_COUNT;
  IF n<>1 THEN RAISE EXCEPTION 'Staff self assignment failed'; END IF;
  BEGIN
   UPDATE public.leads SET owner_id=staff_u,stage='won' WHERE id=l;
   RAISE EXCEPTION 'Staff changed lead stage';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
   UPDATE public.leads SET owner_id=manager_u WHERE id=l;
   RAISE EXCEPTION 'Staff assigned someone else';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  UPDATE public.bookings SET notes_shared='Staff edit' WHERE id=b;
  GET DIAGNOSTICS n=ROW_COUNT;
  IF n<>1 THEN RAISE EXCEPTION 'Assigned staff cannot update booking'; END IF;
  UPDATE public.bookings SET notes_shared='Forbidden' WHERE id=other_b;
  GET DIAGNOSTICS n=ROW_COUNT;
  IF n<>0 THEN RAISE EXCEPTION 'Unassigned staff edited booking'; END IF;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub',manager_u::text,true);
  SET LOCAL ROLE authenticated;
  UPDATE public.clients SET brand_name='Manager edit',updated_at='2000-01-01' WHERE id=c RETURNING updated_at INTO t;
  IF t IS DISTINCT FROM now() THEN RAISE EXCEPTION 'Client timestamp failed'; END IF;
  UPDATE public.leads SET stage='qualified' WHERE id=l RETURNING stage_changed_at INTO t;
  IF t IS DISTINCT FROM now() THEN RAISE EXCEPTION 'Stage timestamp failed'; END IF;
  SELECT count(*) INTO n FROM public.activity WHERE entity_type='lead' AND entity_id=l AND actor_id=manager_u AND verb='stage_changed' AND from_value='new' AND to_value='qualified';
  IF n<>1 THEN RAISE EXCEPTION 'Stage audit failed'; END IF;
  UPDATE public.leads SET value_estimate=100 WHERE id=l;
  SELECT count(*) INTO n FROM public.activity WHERE entity_type='lead' AND entity_id=l;
  IF n<>1 THEN RAISE EXCEPTION 'Unchanged stage created extra audit'; END IF;
  RESET ROLE;
  BEGIN UPDATE public.activity SET verb='forged' WHERE id=audit_id; RAISE EXCEPTION 'Activity edit allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN DELETE FROM public.activity WHERE id=audit_id; RAISE EXCEPTION 'Activity delete allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RAISE EXCEPTION USING ERRCODE='Z0001',MESSAGE='Rollback successful booking tests';
 EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL; END;
END;
$$;