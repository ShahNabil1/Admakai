CREATE POLICY client_uploads_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='client-uploads' AND ((storage.foldername(name))[1]=app.my_client_id()::text OR app.is_staff()));
CREATE POLICY client_uploads_select ON storage.objects FOR SELECT TO authenticated USING (bucket_id='client-uploads' AND ((storage.foldername(name))[1]=app.my_client_id()::text OR app.is_staff()));
CREATE POLICY client_uploads_update ON storage.objects FOR UPDATE TO authenticated USING (bucket_id='client-uploads' AND app.is_manager()) WITH CHECK(bucket_id='client-uploads' AND app.is_manager());
CREATE POLICY client_uploads_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id='client-uploads' AND app.is_manager());
REVOKE ALL ON public.booking_files FROM anon, authenticated;
GRANT SELECT,INSERT ON public.booking_files TO authenticated;
GRANT DELETE ON public.booking_files TO authenticated;
GRANT ALL ON public.booking_files TO service_role;
CREATE POLICY booking_files_add ON public.booking_files FOR INSERT TO authenticated WITH CHECK (EXISTS(SELECT 1 FROM public.bookings b WHERE b.id=booking_id AND b.client_id=app.my_client_id()));
CREATE POLICY booking_files_manager_remove ON public.booking_files FOR DELETE TO authenticated USING(app.is_manager() AND EXISTS(SELECT 1 FROM public.bookings b WHERE b.id=booking_id AND b.status<>'completed'));
CREATE OR REPLACE FUNCTION public.guard_booking_file() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE b public.bookings; stored storage.objects; BEGIN
 IF NEW.booking_id IS NULL THEN RAISE EXCEPTION 'booking_required'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('booking-files:'||NEW.booking_id::text,0));
 SELECT * INTO b FROM public.bookings WHERE id=NEW.booking_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'booking_not_found'; END IF;
 IF (SELECT count(*) FROM public.booking_files WHERE booking_id=NEW.booking_id)>=5 THEN RAISE EXCEPTION 'file_limit_reached'; END IF;
 IF b.status='completed' THEN RAISE EXCEPTION 'booking_completed'; END IF;
 IF NEW.bytes IS NULL OR NEW.bytes<1 OR NEW.bytes>10485760 THEN RAISE EXCEPTION 'file_too_large'; END IF;
 IF NEW.mime IS NULL OR NEW.mime NOT IN ('image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf') THEN RAISE EXCEPTION 'unsupported_file_type'; END IF;
 IF split_part(NEW.storage_path,'/',1)<>b.client_id::text OR split_part(NEW.storage_path,'/',2)<>b.id::text OR split_part(NEW.storage_path,'/',3)='' THEN RAISE EXCEPTION 'invalid_file_path'; END IF;
 SELECT * INTO stored FROM storage.objects WHERE bucket_id='client-uploads' AND name=NEW.storage_path;
 IF NOT FOUND THEN RAISE EXCEPTION 'file_not_uploaded'; END IF;
 IF COALESCE((stored.metadata->>'size')::bigint,0)<>NEW.bytes THEN RAISE EXCEPTION 'file_size_mismatch'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_booking_file() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER booking_files_guard BEFORE INSERT ON public.booking_files FOR EACH ROW EXECUTE FUNCTION public.guard_booking_file();
CREATE UNIQUE INDEX booking_files_unique_path ON public.booking_files(storage_path);
CREATE OR REPLACE FUNCTION app.grant_owner(p_email text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE target uuid; BEGIN
 IF session_user NOT IN ('postgres','supabase_admin') AND NOT app.is_manager() THEN RAISE EXCEPTION 'manager_required' USING ERRCODE='42501'; END IF;
 SELECT u.id INTO target FROM auth.users u JOIN public.profiles p ON p.user_id=u.id WHERE lower(btrim(u.email))=lower(btrim(p_email)) AND u.email_confirmed_at IS NOT NULL;
 IF target IS NULL THEN RETURN false; END IF;
 INSERT INTO public.user_roles(user_id,role) VALUES(target,'owner') ON CONFLICT(user_id) DO UPDATE SET role='owner';
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION app.grant_owner(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION app.grant_owner(text) TO authenticated,service_role;
SELECT app.grant_owner('team@brantatech.org');
CREATE OR REPLACE FUNCTION public.client_call_host(p_booking_id uuid) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT p.full_name FROM public.bookings b JOIN public.profiles p ON p.user_id=b.owner_id WHERE b.id=p_booking_id AND (b.client_id=app.my_client_id() OR app.is_staff()) $$;
REVOKE ALL ON FUNCTION public.client_call_host(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.client_call_host(uuid) TO authenticated,service_role;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') THEN
  IF EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='bookings') THEN ALTER PUBLICATION supabase_realtime DROP TABLE public.bookings; END IF;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings (id,client_id,lead_id,slot_at,duration_minutes,status,owner_id,meet_link,brief,budget_band,source,reschedule_count,notes_shared,recording_url,reminder_24_sent_at,reminder_1_sent_at,completed_at,created_at,updated_at);
 END IF;
END $$;
-- Pure guards / access configuration assertions, with no lasting synthetic data.
DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_functiondef('public.guard_booking_file()'::regprocedure) INTO definition;
 IF position('>=5' in definition)=0 OR position('10485760' in definition)=0 OR position('pg_advisory_xact_lock' in definition)=0 THEN RAISE EXCEPTION 'upload_guard_missing'; END IF;
 IF has_column_privilege('authenticated','public.bookings','notes_internal','SELECT') THEN RAISE EXCEPTION 'internal_notes_exposed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='client_uploads_delete' AND qual LIKE '%is_manager%') THEN RAISE EXCEPTION 'manager_delete_policy_missing'; END IF;
END $$;