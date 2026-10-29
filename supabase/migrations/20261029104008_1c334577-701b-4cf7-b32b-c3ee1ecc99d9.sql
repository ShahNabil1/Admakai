CREATE OR REPLACE FUNCTION app.grant_owner(p_email text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE target uuid; BEGIN
 IF auth.uid() IS NOT NULL THEN
  IF NOT app.is_manager() THEN RAISE EXCEPTION 'manager_required' USING ERRCODE='42501'; END IF;
 ELSIF session_user NOT IN ('postgres','supabase_admin') OR current_setting('role',true) IN ('anon','authenticated') THEN RAISE EXCEPTION 'manager_required' USING ERRCODE='42501'; END IF;
 SELECT u.id INTO target FROM auth.users u JOIN public.profiles p ON p.user_id=u.id WHERE lower(btrim(u.email))=lower(btrim(p_email)) AND u.email_confirmed_at IS NOT NULL;
 IF target IS NULL THEN RETURN false; END IF;
 INSERT INTO public.user_roles(user_id,role) VALUES(target,'owner') ON CONFLICT(user_id) DO UPDATE SET role='owner'; RETURN true;
END $$;
DO $$ DECLARE u uuid:=gen_random_uuid(); c uuid:=gen_random_uuid(); other_c uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); other_b uuid:=gen_random_uuid(); path text; count_files integer; denied boolean; BEGIN
 BEGIN
 INSERT INTO auth.users(id,email,raw_user_meta_data,raw_app_meta_data) VALUES(u,'client-rule-'||u||'@example.invalid','{}','{}');
 INSERT INTO public.clients(id,profile_id,email) VALUES(c,u,'client-rule-'||u||'@example.invalid'),(other_c,NULL,'other-rule-'||u||'@example.invalid');
 INSERT INTO public.bookings(id,client_id,slot_at,status) VALUES(b,c,'2080-01-01T00:00:00Z','completed'),(other_b,other_c,'2080-01-02T00:00:00Z','completed');
 UPDATE public.bookings SET status='requested' WHERE id IN (b,other_b);
 FOR i IN 1..6 LOOP
 path:=c||'/'||b||'/'||gen_random_uuid()||'-test.png';
 INSERT INTO storage.objects(bucket_id,name,metadata) VALUES('client-uploads',path,'{"size":8,"mimetype":"image/png"}');
 IF i<=5 THEN INSERT INTO public.booking_files(booking_id,storage_path,bytes,mime) VALUES(b,path,8,'image/png');
 ELSE denied:=false; BEGIN INSERT INTO public.booking_files(booking_id,storage_path,bytes,mime) VALUES(b,path,8,'image/png'); EXCEPTION WHEN OTHERS THEN IF SQLERRM='file_limit_reached' THEN denied:=true; ELSE RAISE; END IF; END; IF NOT denied THEN RAISE EXCEPTION 'sixth_file_accepted'; END IF; END IF;
 END LOOP;
 PERFORM set_config('request.jwt.claim.sub',u::text,true); PERFORM set_config('request.jwt.claims',json_build_object('sub',u,'role','authenticated')::text,true);
 SET LOCAL ROLE authenticated;
 denied:=false; BEGIN PERFORM app.grant_owner('team@brantatech.org'); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END; IF NOT denied THEN RAISE EXCEPTION 'client_can_grant_owner'; END IF;
 SELECT count(*) INTO count_files FROM public.booking_files WHERE booking_id=b; IF count_files<>5 THEN RAISE EXCEPTION 'client_cannot_read_own_files'; END IF;
 DELETE FROM public.booking_files WHERE booking_id=b; GET DIAGNOSTICS count_files=ROW_COUNT; IF count_files<>0 THEN RAISE EXCEPTION 'client_can_delete_files'; END IF;
 denied:=false; BEGIN INSERT INTO public.booking_files(booking_id,storage_path,bytes,mime) VALUES(other_b,other_c||'/'||other_b||'/test.png',8,'image/png'); EXCEPTION WHEN OTHERS THEN denied:=true; END; IF NOT denied THEN RAISE EXCEPTION 'cross_client_insert_allowed'; END IF;
 RESET ROLE;
 RAISE EXCEPTION 'rollback_client_rule_fixtures' USING ERRCODE='ZX001';
 EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL;
 END;
END $$;