ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS who_its_for text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS job_faqs jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_who_its_for_length CHECK (who_its_for IS NULL OR length(who_its_for) <= 5000);
ALTER TABLE public.jobs ADD CONSTRAINT jobs_job_faqs_shape CHECK (jsonb_typeof(job_faqs) = 'array' AND jsonb_array_length(job_faqs) <= 30);

CREATE OR REPLACE FUNCTION public.hiring_save_job_filters(_job jsonb, _questions jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$ DECLARE saved uuid; BEGIN
saved := public.hiring_admin_save_job(_job,_questions);
UPDATE public.jobs SET
  experience_level = coalesce(_job->>'experience_level', experience_level),
  schedule = coalesce(_job->>'schedule', schedule),
  who_its_for = CASE WHEN _job ? 'who_its_for' THEN nullif(btrim(_job->>'who_its_for'), '') ELSE who_its_for END,
  job_faqs = CASE WHEN _job ? 'job_faqs' AND jsonb_typeof(_job->'job_faqs') = 'array' THEN _job->'job_faqs' ELSE job_faqs END
WHERE id = saved;
IF NOT FOUND THEN RAISE EXCEPTION 'Job filters could not be saved'; END IF;
RETURN saved;
END $function$;

UPDATE public.jobs SET
  title = 'AI Video Artist Intern',
  summary = $t$Admakai makes ad films for real brands using AI instead of cameras. For six months you'll learn our exact process, from the first idea to the final cut, working next to the people who make it every day.$t$,
  description = $t$## About Admakai

Admakai is an AI ad film studio in Dhaka. We make commercials, UGC and fashion films for brands without a single shoot. Our team has made AI ads for more than 40 brands, including SkinO, innsaei and Gentle Park, and is led by AI Director Tanzil Ahmed, who made Bangladesh's first AI web series.

## About the role

This is a learning role first. You'll start by practising on our own in-house projects, with feedback every day from the people who make our client work. As you get better, you'll be brought into real brand projects. The people who prove themselves become part of our core team.

We started this program for a simple reason. We kept looking for people who think like filmmakers and also understand AI, and we kept not finding them. So we decided to train them ourselves.$t$,
  responsibilities = ARRAY[
    'Writing a story that works in 30 seconds',
    'Turning a script into shots: framing, camera movement, lighting and continuity',
    'Creating consistent characters and products with AI image tools',
    'Bringing those images to life with AI video tools like Seedance, Kling and Higgsfield',
    'Voice, music and sound with tools like ElevenLabs and Suno',
    'Editing and colour, and the small details that make AI footage feel real',
    'Writing prompts that give you control instead of luck',
    'How a real brand project runs, from the brief to client approval'
  ],
  requirements = ARRAY[
    $t$A laptop you can use every day. It doesn't have to be a powerful one, most of the tools run online.$t$,
    'A working internet connection',
    'Your evenings: 3 PM to 6 PM and 8 PM to 11 PM, Bangladesh time',
    'A real wish to learn. Honestly, this is the one that matters most.'
  ],
  nice_to_have = ARRAY[]::text[],
  benefits = ARRAY[
    'Learn from zero',
    'Hands-on training from working AI directors',
    'Work on real brand projects',
    'The best join our core team'
  ],
  who_its_for = $t$Students, fresh graduates, video editors, designers, or anyone who watches an ad and thinks they could make it better. You don't need to know a single AI tool yet.

If you only want a certificate, this isn't for you. This is hands-on work, every day.$t$,
  job_faqs = jsonb_build_array(
    jsonb_build_object('question', 'Do I need any experience?', 'answer', 'No. We teach from zero. What we look for is curiosity and the patience to practise.'),
    jsonb_build_object('question', 'What kind of laptop do I need?', 'answer', 'Any laptop that runs a modern browser smoothly. Most AI tools we use run online.'),
    jsonb_build_object('question', 'Can I join remotely?', 'answer', $t$Yes. You can join remotely or come to our office in Dhaka. Live sessions happen online, so you won't miss anything either way.$t$),
    jsonb_build_object('question', 'What are the hours?', 'answer', '3 PM to 6 PM and 8 PM to 11 PM, Bangladesh time.'),
    jsonb_build_object('question', 'How does selection work?', 'answer', 'Apply in about 10 minutes, we review every application, then we invite selected people for a short interview. You can track every step live from your dashboard.'),
    jsonb_build_object('question', 'What happens after 6 months?', 'answer', 'People who prove themselves during the program are invited to join our core team.'),
    jsonb_build_object('question', 'Can I work with another agency at the same time?', 'answer', 'Not with a competing agency or AI video studio during the 6 months.')
  ),
  experience_level = 'none',
  schedule = 'evening'
WHERE id = 'e2000000-0000-4000-8000-000000000001';

CREATE TABLE public.saved_jobs (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, job_id)
);
REVOKE ALL ON public.saved_jobs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.saved_jobs TO authenticated;
GRANT ALL ON public.saved_jobs TO service_role;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own saved roles are visible" ON public.saved_jobs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "People save open roles for themselves" ON public.saved_jobs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.status = 'open'));
CREATE POLICY "People remove their own saved roles" ON public.saved_jobs FOR DELETE TO authenticated USING (user_id = auth.uid());