ALTER TABLE public.hiring_settings ADD COLUMN authorised_signatory_name text NOT NULL DEFAULT 'Nasrin Akter', ADD COLUMN authorised_signatory_title text NOT NULL DEFAULT 'Chief Executive Officer';
INSERT INTO public.agreement_templates(name,job_type,version,body,key_terms,is_current) VALUES ('Application Declaration and Consent','internship',1,$body$**APPLICATION DECLARATION AND CONSENT**
Admakai Internship Program

I, {{candidate_name}}, am applying for the position of {{job_title}} at Admakai (Application ID {{application_id}}) on {{date}}. I declare and agree to the following.

**1. Accurate information**
Everything I have shared in this application, including my photo, answers and links, is true and my own. I understand that false information can lead to my application being rejected or, if selected later, my place being cancelled.

**2. No fee, no guarantee**
I understand that Admakai never charges any fee at any stage of applying or learning, and will never ask me for money. Submitting this application does not guarantee an interview or a place in the program.

**3. Privacy and use of my information**
I have read and accept the Admakai Privacy Policy (admakai.com/privacy) and Terms of Service (admakai.com/terms). I allow Admakai to store and use my information only to review my application and to contact me about it. My information is kept private, is never sold, and can be deleted on my request. If I am not selected, Admakai may keep my application for up to 12 months to consider me for future openings, unless I ask for it to be deleted.

**4. Contact**
I agree that Admakai may contact me by email, phone or WhatsApp about this application.

**5. Program guidelines**
I have read the program summary on the job page: a 6 month program with no fee, learning first and then paid project work for those who do well, working hours of 3 PM to 6 PM and 8 PM to 11 PM, and no work with any competing agency or AI video studio during the program. I understand that the full terms will be given to me in a separate offer letter if I am selected, and nothing in this declaration makes me an employee.

**6. Confidentiality during selection**
Anything Admakai shares with me during selection, such as interview details or internal material, is for this purpose only and I will not share it publicly.

**7. My choice**
I can withdraw my application at any time from my dashboard. Admakai may decide on applications at its discretion.$body$,'["I confirm that all the information I have given is true.","I have read and accept the Admakai Privacy Policy and Terms of Service.","I understand Admakai never charges a fee and an application does not guarantee selection.","I agree to be contacted by email, phone or WhatsApp about my application.","I understand this is a declaration, not an employment contract, and the program terms will come in an offer letter if I am selected."]',true);
INSERT INTO public.hiring_agreement_reviews(template_id,legal_review_pending) SELECT id,true FROM public.agreement_templates WHERE name='Application Declaration and Consent' AND version=1;
UPDATE public.jobs SET agreement_template_id=(SELECT id FROM public.agreement_templates WHERE name='Application Declaration and Consent' AND version=1) WHERE id='e2000000-0000-4000-8000-000000000001';
CREATE TABLE public.application_pdf_versions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),application_id uuid NOT NULL REFERENCES public.applications(id),event_id uuid NOT NULL,template_id uuid NOT NULL REFERENCES public.agreement_templates(id),template_version integer NOT NULL,status_key text NOT NULL,status_label text NOT NULL,file_path text NOT NULL UNIQUE,pdf_sha256 text NOT NULL CHECK(pdf_sha256 ~ '^[a-f0-9]{64}$'),document_id text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(application_id,event_id));
REVOKE ALL ON public.application_pdf_versions FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.application_pdf_versions TO authenticated;
GRANT SELECT,INSERT ON public.application_pdf_versions TO service_role;
ALTER TABLE public.application_pdf_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owned or assigned PDF editions" ON public.application_pdf_versions FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.applications a WHERE a.id=application_id));
CREATE TRIGGER application_pdf_versions_immutable BEFORE UPDATE OR DELETE ON public.application_pdf_versions FOR EACH ROW EXECUTE FUNCTION public.hiring_reject_mutation();
CREATE FUNCTION public.hiring_queue_pdf_edition() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE s public.signed_agreements; t public.agreement_templates; j public.jobs; stage public.pipeline_stages; ev uuid; snap jsonb; BEGIN
 IF NEW.is_draft OR (TG_OP='UPDATE' AND NEW.status_key=OLD.status_key AND NEW.is_draft=OLD.is_draft) THEN RETURN NEW; END IF;
 SELECT * INTO s FROM public.signed_agreements WHERE application_id=NEW.id; IF NOT FOUND THEN RETURN NEW; END IF;
 SELECT * INTO t FROM public.agreement_templates WHERE id=s.template_id;
 SELECT * INTO j FROM public.jobs WHERE id=NEW.job_id;
 SELECT * INTO stage FROM public.pipeline_stages WHERE pipeline_id=j.application_pipeline_id AND key=NEW.status_key;
 SELECT id INTO ev FROM public.application_events WHERE application_id=NEW.id AND to_status=NEW.status_key ORDER BY created_at DESC LIMIT 1;
 ev:=coalesce(ev,gen_random_uuid()); IF TG_OP='UPDATE' AND OLD.is_draft THEN ev:=NEW.id; END IF;
 snap:=jsonb_build_object('app',to_jsonb(NEW),'candidate',(SELECT to_jsonb(c) FROM public.candidates c WHERE id=NEW.candidate_id),'job',to_jsonb(j),'profile',(SELECT jsonb_build_object('email',email) FROM public.profiles WHERE user_id=NEW.candidate_id),'settings',(SELECT to_jsonb(h) FROM public.hiring_settings h WHERE id=true),'signed',to_jsonb(s),'template',to_jsonb(t),'answers',(SELECT coalesce(jsonb_agg(jsonb_build_object('label',coalesce(q.label_override,b.label),'answer',a.answer)),'[]'::jsonb) FROM public.application_answers a JOIN public.job_questions q ON q.id=a.job_question_id LEFT JOIN public.question_bank b ON b.id=q.question_id WHERE a.application_id=NEW.id));
 INSERT INTO public.delivery_outbox(kind,trigger_key,event_id,application_id,payload) VALUES('agreement_pdf',CASE WHEN TG_OP='UPDATE' AND OLD.is_draft THEN 'agreement' ELSE 'agreement-status' END,ev,NEW.id,jsonb_build_object('application_id',NEW.id,'snapshot',snap,'status_key',NEW.status_key,'status_label',coalesce(stage.candidate_label,NEW.status_key),'status_color',coalesce(stage.color,'#444444'),'edition_at',now())) ON CONFLICT(event_id,kind,trigger_key) DO NOTHING;
 RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.hiring_queue_pdf_edition() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER hiring_queue_pdf_edition AFTER UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.hiring_queue_pdf_edition();