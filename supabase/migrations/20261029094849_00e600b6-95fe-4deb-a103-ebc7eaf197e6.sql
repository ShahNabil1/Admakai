REVOKE SELECT ON public.bookings FROM authenticated;
GRANT SELECT (id, client_id, lead_id, slot_at, duration_minutes, status, owner_id, meet_link, brief, budget_band, source, reschedule_count, notes_shared, recording_url, reminder_24_sent_at, reminder_1_sent_at, completed_at, created_at, updated_at) ON public.bookings TO authenticated;
CREATE FUNCTION app.booking_internal_notes(booking_uuid uuid) RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result text;
BEGIN
 IF auth.uid() IS NULL OR NOT app.is_staff() THEN RAISE EXCEPTION 'Internal notes are staff only' USING ERRCODE='42501'; END IF;
 SELECT notes_internal INTO result FROM public.bookings WHERE id=booking_uuid;
 RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION app.booking_internal_notes(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app.booking_internal_notes(uuid) TO authenticated, service_role;
DO $$
DECLARE u uuid:=gen_random_uuid(); s uuid:=gen_random_uuid(); c uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); v text;
BEGIN
 BEGIN
  INSERT INTO auth.users(id,email) VALUES(u,'notes-client@example.invalid'),(s,'notes-staff@example.invalid');
  UPDATE public.user_roles SET role='member' WHERE user_id=s;
  INSERT INTO public.clients(id,profile_id) VALUES(c,u);
  INSERT INTO public.bookings(id,client_id,slot_at,notes_internal) VALUES(b,c,'2097-01-01 10:00:00+00','Private staff note');
  PERFORM set_config('request.jwt.claim.sub',u::text,true);
  SET LOCAL ROLE authenticated;
  SELECT notes_shared INTO v FROM public.bookings WHERE id=b;
  BEGIN SELECT notes_internal INTO v FROM public.bookings WHERE id=b; RAISE EXCEPTION 'Client read internal notes'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM app.booking_internal_notes(b); RAISE EXCEPTION 'Client accessed internal notes helper'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN INSERT INTO public.activity(entity_type,entity_id,actor_id,verb) VALUES('booking',b,s,'forged'); RAISE EXCEPTION 'Client forged audit actor'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub',s::text,true);
  SET LOCAL ROLE authenticated;
  IF app.booking_internal_notes(b) IS DISTINCT FROM 'Private staff note' THEN RAISE EXCEPTION 'Staff notes lookup failed'; END IF;
  RESET ROLE;
  RAISE EXCEPTION USING ERRCODE='Z0001',MESSAGE='Rollback successful internal-note tests';
 EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL; END;
END;
$$;