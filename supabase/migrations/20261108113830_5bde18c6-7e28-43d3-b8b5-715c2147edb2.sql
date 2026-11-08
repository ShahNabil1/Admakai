CREATE TABLE public.enquiries(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
 lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
 service_interest text, budget_band text, message text, attachment_path text, source_page text,
 created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX enquiries_lead_idx ON public.enquiries(lead_id);
CREATE INDEX enquiries_created_idx ON public.enquiries(created_at DESC);
REVOKE ALL ON public.enquiries FROM anon, authenticated;
GRANT SELECT ON public.enquiries TO authenticated;
GRANT ALL ON public.enquiries TO service_role;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY enquiries_staff_read ON public.enquiries FOR SELECT TO authenticated USING ((SELECT app.is_staff()));

CREATE OR REPLACE FUNCTION app.create_enquiry(p_name text,p_email text,p_whatsapp text,p_brand_name text,p_website text,p_service_interest text,p_budget_band text,p_message text,p_source_page text,p_attachment_path text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE e text:=lower(btrim(p_email)); n text:=btrim(p_name); phone text:=regexp_replace(COALESCE(p_whatsapp,''),'[^0-9+]','','g');
 client_uuid uuid; lead_uuid uuid; enquiry_uuid uuid:=gen_random_uuid(); new_lead boolean:=false; verified_profile uuid;
BEGIN
 IF n IS NULL OR n='' OR length(n)>100 THEN RAISE EXCEPTION 'name_required' USING ERRCODE='22023'; END IF;
 IF e IS NULL OR length(e)>254 OR e !~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$' THEN RAISE EXCEPTION 'invalid_email' USING ERRCODE='22023'; END IF;
 IF phone<>'' AND phone NOT LIKE '+%' THEN phone:='+'||phone; END IF;
 IF phone<>'' AND phone !~ '^\+[1-9][0-9]{7,14}$' THEN RAISE EXCEPTION 'invalid_whatsapp' USING ERRCODE='22023'; END IF;
 IF length(COALESCE(p_message,''))>2000 OR length(COALESCE(p_brand_name,''))>150 OR length(COALESCE(p_website,''))>300 OR length(COALESCE(p_service_interest,''))>120 OR length(COALESCE(p_budget_band,''))>40 OR length(COALESCE(p_source_page,''))>200 THEN RAISE EXCEPTION 'invalid_input' USING ERRCODE='22023'; END IF;
 IF p_attachment_path IS NOT NULL AND p_attachment_path !~ '^enquiries/[0-9a-f-]{36}\.(png|jpg|pdf)$' THEN RAISE EXCEPTION 'invalid_attachment' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('enquiry-email:'||e,0));
 IF (SELECT count(*) FROM public.enquiries q JOIN public.clients c ON c.id=q.client_id WHERE lower(c.email)=e AND q.created_at>=now()-interval '1 hour')>=3 THEN RAISE EXCEPTION 'rate_limited'; END IF;
 SELECT c.id INTO client_uuid FROM public.clients c WHERE lower(c.email)=e;
 IF client_uuid IS NULL THEN
  SELECT u.id INTO verified_profile FROM auth.users u WHERE lower(u.email)=e AND u.email_confirmed_at IS NOT NULL AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.user_id=u.id);
  INSERT INTO public.clients(contact_name,email,whatsapp,brand_name,website,is_customer,profile_id)
  VALUES(n,e,NULLIF(phone,''),NULLIF(btrim(p_brand_name),''),NULLIF(btrim(p_website),''),false,verified_profile) RETURNING id INTO client_uuid;
 END IF;
 SELECT l.id INTO lead_uuid FROM public.leads l WHERE l.client_id=client_uuid AND l.stage NOT IN ('won','lost') ORDER BY l.created_at,l.id LIMIT 1;
 IF lead_uuid IS NULL THEN
  INSERT INTO public.leads(client_id,stage,source) VALUES(client_uuid,'new',jsonb_build_object('channel','enquiry','page',p_source_page)) RETURNING id INTO lead_uuid; new_lead:=true;
 END IF;
 INSERT INTO public.enquiries(id,client_id,lead_id,service_interest,budget_band,message,attachment_path,source_page)
 VALUES(enquiry_uuid,client_uuid,lead_uuid,NULLIF(p_service_interest,''),NULLIF(p_budget_band,''),NULLIF(btrim(p_message),''),p_attachment_path,NULLIF(p_source_page,''));
 INSERT INTO public.activity(entity_type,entity_id,actor_id,verb,meta) VALUES('lead',lead_uuid,NULL,'enquiry',jsonb_build_object('enquiry_id',enquiry_uuid,'client_id',client_uuid,'page',p_source_page));
 IF new_lead THEN INSERT INTO public.activity(entity_type,entity_id,actor_id,verb,meta) VALUES('lead',lead_uuid,NULL,'created',jsonb_build_object('client_id',client_uuid,'source','enquiry')); END IF;
 RETURN enquiry_uuid;
END $$;
REVOKE ALL ON FUNCTION app.create_enquiry(text,text,text,text,text,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION app.create_enquiry(text,text,text,text,text,text,text,text,text,text) TO service_role;
CREATE OR REPLACE FUNCTION public.create_enquiry(p_name text,p_email text,p_whatsapp text,p_brand_name text,p_website text,p_service_interest text,p_budget_band text,p_message text,p_source_page text,p_attachment_path text DEFAULT NULL)
RETURNS uuid LANGUAGE sql SET search_path TO '' AS $$ SELECT app.create_enquiry(p_name,p_email,p_whatsapp,p_brand_name,p_website,p_service_interest,p_budget_band,p_message,p_source_page,p_attachment_path) $$;
REVOKE ALL ON FUNCTION public.create_enquiry(text,text,text,text,text,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_enquiry(text,text,text,text,text,text,text,text,text,text) TO service_role;

CREATE POLICY enquiry_uploads_staff_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id='enquiry-uploads' AND (SELECT app.is_staff()));

ALTER TABLE public.email_log ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS email_log_booking_idx ON public.email_log(booking_id, trigger_key);

INSERT INTO public.email_templates(trigger_key,subject,body,is_enabled) VALUES
('booking_requested','Request received: your Admakai call','Hi {{client_name}},\n\nThanks for booking a call with Admakai. We received your request for {{booking_time}} (Asia/Dhaka). We will confirm it shortly with a meeting link.',true),
('booking_confirmed','Confirmed: your Admakai call on {{booking_time}}','Hi {{client_name}},\n\nYour call is confirmed for {{booking_time}} (Asia/Dhaka), {{duration}} minutes.\nMeeting link: {{meet_link}}\n\nA calendar file is attached.',true),
('booking_rescheduled','Your Admakai call was rescheduled','Hi {{client_name}},\n\nYour call has been rescheduled. New time: {{booking_time}} (Asia/Dhaka).\n{{reason}}',true),
('booking_cancelled','Your Admakai call was cancelled','Hi {{client_name}},\n\nYour call on {{booking_time}} (Asia/Dhaka) was cancelled.\n{{reason}}\n\nYou can book a new time at https://admakai.com/book',true),
('booking_reminder','Reminder: your Admakai call tomorrow','Hi {{client_name}},\n\nA reminder that your call is at {{booking_time}} (Asia/Dhaka).\nMeeting link: {{meet_link}}',true),
('booking_new_admin','New booking request: {{client_name}}','New booking request.\n\nName: {{client_name}}\nEmail: {{client_email}}\nBrand: {{brand}}\nTime: {{booking_time}} (Asia/Dhaka)\nMessage: {{message}}',true),
('enquiry_received','We got your message','Hi {{client_name}},\n\nThanks for contacting Admakai. We got your message and will reply soon.',true),
('enquiry_new_admin','New enquiry: {{client_name}}','New enquiry from {{source_page}}.\n\nName: {{client_name}}\nEmail: {{client_email}}\nWhatsApp: {{whatsapp}}\nBrand: {{brand}}\nService: {{service}}\nBudget: {{budget}}\nMessage: {{message}}',true)
ON CONFLICT (trigger_key) DO NOTHING;