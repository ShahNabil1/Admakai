CREATE OR REPLACE FUNCTION hiring_private.hiring_set_passport_photo(_application_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE uid uuid := auth.uid(); path text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sign in to continue' USING ERRCODE='42501'; END IF;
  PERFORM 1 FROM public.applications
    WHERE id=_application_id AND candidate_id=uid AND is_draft AND status_key='draft'
      AND submitted_at IS NULL AND withdrawn_at IS NULL
    FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Submitted passport photo cannot change' USING ERRCODE='42501'; END IF;
  path := uid::text||'/'||_application_id::text||'/passport.jpg';
  IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='task-files' AND name=path) THEN
    RAISE EXCEPTION 'Upload your passport size photo first';
  END IF;
  UPDATE public.applications SET passport_photo_path=path WHERE id=_application_id AND candidate_id=uid AND is_draft;
  UPDATE public.candidates SET photo_url=path WHERE id=uid AND photo_url IS NULL;
  RETURN path;
END $function$;
REVOKE ALL ON FUNCTION hiring_private.hiring_set_passport_photo(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION hiring_private.hiring_set_passport_photo(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.hiring_set_passport_photo(_application_id uuid)
RETURNS text
LANGUAGE sql
SET search_path TO 'public'
AS $function$ SELECT hiring_private.hiring_set_passport_photo(_application_id) $function$;
REVOKE ALL ON FUNCTION public.hiring_set_passport_photo(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hiring_set_passport_photo(uuid) TO authenticated;