ALTER FUNCTION public.hiring_public_internship_video() SET SCHEMA hiring_private;
CREATE FUNCTION public.hiring_public_internship_video() RETURNS TABLE(internship_video_url text,internship_video_poster_url text,internship_video_title text) LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$ SELECT * FROM hiring_private.hiring_public_internship_video(); $$;
REVOKE ALL ON FUNCTION public.hiring_public_internship_video() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.hiring_public_internship_video() TO anon,authenticated,service_role;
GRANT USAGE ON SCHEMA hiring_private TO anon,authenticated,service_role;