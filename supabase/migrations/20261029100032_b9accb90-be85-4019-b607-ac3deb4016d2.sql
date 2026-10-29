ALTER TABLE public.clients ADD COLUMN contact_name text, ADD COLUMN email text;
CREATE UNIQUE INDEX clients_lower_email_unique_idx ON public.clients(lower(email)) WHERE email IS NOT NULL;
CREATE FUNCTION public.link_client_to_verified_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE client_uuid uuid;
BEGIN
 IF EXISTS(SELECT 1 FROM auth.users u WHERE u.id=NEW.user_id AND u.email_confirmed_at IS NOT NULL AND lower(u.email)=lower(NEW.email)) THEN
  UPDATE public.clients SET profile_id=NEW.user_id WHERE lower(email)=lower(NEW.email) AND profile_id IS NULL RETURNING id INTO client_uuid;
  IF client_uuid IS NOT NULL THEN
   INSERT INTO public.activity(entity_type,entity_id,actor_id,verb,to_value) VALUES('client',client_uuid,NEW.user_id,'profile_linked',NEW.user_id::text);
  END IF;
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.link_client_to_verified_profile() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER profiles_link_client AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.link_client_to_verified_profile();
CREATE FUNCTION public.link_client_on_email_confirmation() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE client_uuid uuid;
BEGIN
 IF NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR NEW.email IS DISTINCT FROM OLD.email) THEN
  UPDATE public.clients c SET profile_id=NEW.id WHERE lower(c.email)=lower(NEW.email) AND c.profile_id IS NULL AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.user_id=NEW.id) RETURNING c.id INTO client_uuid;
  IF client_uuid IS NOT NULL THEN INSERT INTO public.activity(entity_type,entity_id,actor_id,verb,to_value) VALUES('client',client_uuid,NEW.id,'profile_linked',NEW.id::text); END IF;
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.link_client_on_email_confirmation() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER on_auth_email_confirmed_link_client AFTER UPDATE OF email_confirmed_at,email ON auth.users FOR EACH ROW EXECUTE FUNCTION public.link_client_on_email_confirmation();

CREATE FUNCTION app.create_booking(p_slot_at timestamptz,p_name text,p_email text,p_whatsapp text,p_brand text,p_need text,p_message text,p_budget_band text,p_source jsonb DEFAULT '{}'::jsonb)
RETURNS uuid LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE normalized_email text:=lower(btrim(p_email)); normalized_name text:=btrim(p_name); normalized_brand text:=btrim(p_brand);
 phone text; digits text; client_uuid uuid; lead_uuid uuid; booking_uuid uuid:=gen_random_uuid(); new_lead boolean:=false;
 r public.availability_rules%ROWTYPE; verified_profile uuid; local_date date;
BEGIN
 IF normalized_name IS NULL OR normalized_name='' THEN RAISE EXCEPTION 'name_required' USING ERRCODE='22023'; END IF;
 IF normalized_email IS NULL OR length(normalized_email)>254 OR normalized_email !~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$' THEN RAISE EXCEPTION 'invalid_email' USING ERRCODE='22023'; END IF;
 phone:=regexp_replace(COALESCE(p_whatsapp,''),'[[:space:]-]','','g');
 IF phone !~ '^\+?[0-9]+$' THEN RAISE EXCEPTION 'invalid_whatsapp' USING ERRCODE='22023'; END IF;
 digits:=regexp_replace(phone,'[^0-9]','','g');
 IF length(digits)<10 OR length(digits)>15 THEN RAISE EXCEPTION 'invalid_whatsapp' USING ERRCODE='22023'; END IF;
 IF digits ~ '^01[3-9][0-9]{8}$' THEN phone:='+88'||digits;
 ELSIF digits ~ '^1[3-9][0-9]{8}$' THEN phone:='+880'||digits;
 ELSIF digits ~ '^8801[3-9][0-9]{8}$' THEN phone:='+'||digits;
 ELSIF phone !~ '^\+[1-9][0-9]{9,14}$' THEN RAISE EXCEPTION 'invalid_whatsapp' USING ERRCODE='22023'; END IF;
 IF p_need IS NULL OR p_need NOT IN ('tvc','product_photos','ugc','brand_face','unsure') THEN RAISE EXCEPTION 'invalid_need' USING ERRCODE='22023'; END IF;
 IF p_budget_band IS NULL OR p_budget_band NOT IN ('not_decided','30k_80k','80k_plus') THEN RAISE EXCEPTION 'invalid_budget_band' USING ERRCODE='22023'; END IF;
 IF p_source IS NOT NULL AND jsonb_typeof(p_source)<>'object' THEN RAISE EXCEPTION 'invalid_source' USING ERRCODE='22023'; END IF;
 -- Serializes this email and local day so rate and daily caps are rechecked after concurrent commits.
 PERFORM pg_advisory_xact_lock(hashtextextended('booking-email:'||normalized_email,0));
 IF (SELECT count(*) FROM public.bookings b JOIN public.clients c ON c.id=b.client_id WHERE lower(c.email)=normalized_email AND b.created_at>=now()-interval '24 hours')>=3 THEN RAISE EXCEPTION 'rate_limited'; END IF;
 SELECT * INTO r FROM public.availability_rules WHERE id=true FOR SHARE;
 local_date:=(p_slot_at AT TIME ZONE r.business_timezone)::date;
 IF p_slot_at IS NULL OR NOT FOUND THEN RAISE EXCEPTION 'slot_unavailable'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('booking-day:'||local_date::text,0));
 IF NOT EXISTS(SELECT 1 FROM app.open_slots() s WHERE s.slot_at=p_slot_at) THEN RAISE EXCEPTION 'slot_unavailable'; END IF;
 SELECT c.id INTO client_uuid FROM public.clients c WHERE lower(c.email)=normalized_email;
 IF client_uuid IS NULL THEN
  SELECT u.id INTO verified_profile FROM auth.users u WHERE lower(u.email)=normalized_email AND u.email_confirmed_at IS NOT NULL AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.user_id=u.id);
  INSERT INTO public.clients(contact_name,email,whatsapp,brand_name,is_customer,profile_id)
  VALUES(normalized_name,normalized_email,phone,normalized_brand,false,verified_profile) RETURNING id INTO client_uuid;
 END IF;
 SELECT l.id INTO lead_uuid FROM public.leads l WHERE l.client_id=client_uuid AND l.stage NOT IN ('won','lost') ORDER BY l.created_at,l.id LIMIT 1;
 IF lead_uuid IS NULL THEN
  INSERT INTO public.leads(client_id,stage,source) VALUES(client_uuid,'new',COALESCE(p_source,'{}'::jsonb)) RETURNING id INTO lead_uuid;
  new_lead:=true;
 END IF;
 INSERT INTO public.bookings(id,client_id,lead_id,slot_at,status,duration_minutes,brief,budget_band,source)
 VALUES(booking_uuid,client_uuid,lead_uuid,p_slot_at,'requested',r.slot_minutes,jsonb_build_object('need',p_need,'message',p_message,'budget_band',p_budget_band),p_budget_band,COALESCE(p_source,'{}'::jsonb));
 UPDATE public.leads SET booking_id=booking_uuid WHERE id=lead_uuid;
 INSERT INTO public.activity(entity_type,entity_id,actor_id,verb,meta) VALUES('booking',booking_uuid,auth.uid(),'created',jsonb_build_object('client_id',client_uuid,'lead_id',lead_uuid));
 IF new_lead THEN INSERT INTO public.activity(entity_type,entity_id,actor_id,verb,meta) VALUES('lead',lead_uuid,auth.uid(),'created',jsonb_build_object('client_id',client_uuid)); END IF;
 RETURN booking_uuid;
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'slot_unavailable';
END;
$$;
REVOKE ALL ON FUNCTION app.create_booking(timestamptz,text,text,text,text,text,text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.create_booking(timestamptz,text,text,text,text,text,text,text,jsonb) TO anon,authenticated,service_role;
CREATE FUNCTION public.create_booking(p_slot_at timestamptz,p_name text,p_email text,p_whatsapp text,p_brand text,p_need text,p_message text,p_budget_band text,p_source jsonb DEFAULT '{}'::jsonb)
RETURNS uuid LANGUAGE sql VOLATILE SET search_path='' AS $$ SELECT app.create_booking(p_slot_at,p_name,p_email,p_whatsapp,p_brand,p_need,p_message,p_budget_band,p_source) $$;
REVOKE ALL ON FUNCTION public.create_booking(timestamptz,text,text,text,text,text,text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking(timestamptz,text,text,text,text,text,text,text,jsonb) TO anon,authenticated,service_role;

-- Temporary evidence only; all real test rows and activity are rolled back without disabling immutability.
CREATE TABLE public.booking_setup_verification(evidence jsonb NOT NULL);
REVOKE ALL ON public.booking_setup_verification FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.booking_setup_verification TO service_role,supabase_read_only_user;
ALTER TABLE public.booking_setup_verification ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE evidence jsonb; initial_slot timestamptz; next_slot timestamptz; bid uuid; cid uuid; lid uuid; uid uuid:=gen_random_uuid(); duplicate_error text; rate_error text; i int; n int; email_test text:='booking-proof-20261029@example.invalid';
BEGIN
 BEGIN
  SELECT slot_at INTO initial_slot FROM app.open_slots() LIMIT 1;
  IF initial_slot IS NULL THEN RAISE EXCEPTION 'No slots available for proof'; END IF;
  SET LOCAL ROLE anon;
  bid:=public.create_booking(initial_slot,'  Nadia Rahman  ',' Booking-Proof-20261029@Example.Invalid ','01712-345 678','  Demo Beauty Studio  ','tvc','Synthetic test: 30-second product commercial','30k_80k','{"test":"booking-setup"}'::jsonb);
  RESET ROLE;
  SELECT client_id,lead_id INTO cid,lid FROM public.bookings WHERE id=bid;
  IF NOT EXISTS(SELECT 1 FROM public.clients WHERE id=cid AND contact_name='Nadia Rahman' AND email=email_test AND whatsapp='+8801712345678' AND brand_name='Demo Beauty Studio' AND NOT is_customer AND profile_id IS NULL) THEN RAISE EXCEPTION 'Normalization failed'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.leads WHERE id=lid AND booking_id=bid AND stage='new') THEN RAISE EXCEPTION 'Lead linking failed'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.bookings WHERE id=bid AND status='requested' AND duration_minutes=30 AND brief->>'need'='tvc' AND brief->>'budget_band'='30k_80k') THEN RAISE EXCEPTION 'Booking fields failed'; END IF;
  SELECT jsonb_build_object('slot',initial_slot,'clients',(SELECT to_jsonb(c) FROM public.clients c WHERE id=cid),'leads',(SELECT to_jsonb(l) FROM public.leads l WHERE id=lid),'bookings',(SELECT to_jsonb(b) FROM public.bookings b WHERE id=bid),'activity',(SELECT jsonb_agg(to_jsonb(a)) FROM public.activity a WHERE entity_id IN(bid,lid))) INTO evidence;
  SET LOCAL ROLE anon;
  BEGIN
   PERFORM public.create_booking(initial_slot,'Nadia Rahman',email_test,'01712345678','Demo Beauty Studio','tvc','Repeat slot','30k_80k');
   RAISE EXCEPTION 'Duplicate slot succeeded';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'slot_unavailable' THEN RAISE; END IF; duplicate_error:=SQLERRM; END;
  FOR i IN 1..2 LOOP
   SELECT slot_at INTO next_slot FROM app.open_slots() LIMIT 1;
   PERFORM public.create_booking(next_slot,'Nadia Rahman',email_test,'01712345678','Demo Beauty Studio','ugc','Next test booking','not_decided');
  END LOOP;
  SELECT slot_at INTO next_slot FROM app.open_slots() LIMIT 1;
  BEGIN
   PERFORM public.create_booking(next_slot,'Nadia Rahman',email_test,'01712345678','Demo Beauty Studio','unsure','Fourth booking','not_decided');
   RAISE EXCEPTION 'Fourth booking succeeded';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'rate_limited' THEN RAISE; END IF; rate_error:=SQLERRM; END;
  RESET ROLE;
  SELECT count(*) INTO n FROM public.leads WHERE client_id=cid;
  IF n<>1 THEN RAISE EXCEPTION 'Open lead was not reused'; END IF;
  SELECT count(*) INTO n FROM public.bookings WHERE client_id=cid;
  IF n<>3 THEN RAISE EXCEPTION 'Rate limit proof must create exactly three bookings'; END IF;
  evidence:=evidence||jsonb_build_object('duplicate_slot_error',duplicate_error,'fourth_booking_error',rate_error,'successful_bookings',n,'open_leads',1);
  -- Unverified signup must not claim an existing client; confirmation links and audits exactly once.
  INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES(uid,email_test,'{"name":"Nadia Rahman"}');
  IF EXISTS(SELECT 1 FROM public.clients WHERE id=cid AND profile_id IS NOT NULL) THEN RAISE EXCEPTION 'Unverified signup linked client'; END IF;
  UPDATE auth.users SET email_confirmed_at=now() WHERE id=uid;
  IF NOT EXISTS(SELECT 1 FROM public.clients WHERE id=cid AND profile_id=uid) THEN RAISE EXCEPTION 'Verified profile link failed'; END IF;
  IF (SELECT count(*) FROM public.activity WHERE entity_id=cid AND verb='profile_linked')<>1 THEN RAISE EXCEPTION 'Profile link audit failed'; END IF;
  evidence:=evidence||jsonb_build_object('unverified_link_blocked',true,'verified_link_passed',true);
  RAISE EXCEPTION USING ERRCODE='Z0001',MESSAGE='Rollback test data';
 EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL; END;
 IF EXISTS(SELECT 1 FROM public.clients WHERE email=email_test) OR EXISTS(SELECT 1 FROM public.bookings WHERE id=bid) OR EXISTS(SELECT 1 FROM public.leads WHERE id=lid) OR EXISTS(SELECT 1 FROM public.activity WHERE entity_id IN(bid,lid,cid)) OR EXISTS(SELECT 1 FROM auth.users WHERE id=uid) THEN RAISE EXCEPTION 'Test cleanup failed'; END IF;
 INSERT INTO public.booking_setup_verification(evidence) VALUES(evidence||jsonb_build_object('all_test_rows_rolled_back',true));
END;
$$;