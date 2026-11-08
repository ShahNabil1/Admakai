ALTER TABLE public.hiring_settings ADD COLUMN internship_video_url text, ADD COLUMN internship_video_poster_url text, ADD COLUMN internship_video_title text DEFAULT 'Hear it from our AI Director';

CREATE FUNCTION public.hiring_sync_owner_admin() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF TG_OP IN ('UPDATE','DELETE') THEN
   IF OLD.role::text = 'owner' AND (TG_OP = 'DELETE' OR NEW.role::text <> 'owner' OR NEW.user_id <> OLD.user_id) THEN
     DELETE FROM public.hiring_user_roles WHERE user_id = OLD.user_id AND role = 'admin'::public.app_role;
   END IF;
 END IF;
 IF TG_OP IN ('INSERT','UPDATE') THEN
   IF NEW.role::text = 'owner' THEN
     INSERT INTO public.hiring_user_roles(user_id,role) VALUES(NEW.user_id,'admin') ON CONFLICT(user_id,role) DO NOTHING;
   END IF;
 END IF;
 RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.hiring_sync_owner_admin() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER hiring_owner_admin_sync AFTER INSERT OR UPDATE OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.hiring_sync_owner_admin();

INSERT INTO public.hiring_user_roles(user_id,role) SELECT user_id,'admin'::public.app_role FROM public.user_roles WHERE role::text='owner' ON CONFLICT(user_id,role) DO NOTHING;

CREATE FUNCTION public.hiring_public_internship_video() RETURNS TABLE(internship_video_url text,internship_video_poster_url text,internship_video_title text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT s.internship_video_url,s.internship_video_poster_url,s.internship_video_title FROM public.hiring_settings s WHERE s.id = true;
$$;
REVOKE ALL ON FUNCTION public.hiring_public_internship_video() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.hiring_public_internship_video() TO anon,authenticated,service_role;

DO $$ DECLARE uid uuid := gen_random_uuid(); BEGIN
 BEGIN
  INSERT INTO auth.users(id,email,raw_user_meta_data,raw_app_meta_data,aud,role) VALUES(uid,'hiring-owner-proof-'||uid::text||'@example.invalid','{}','{}','authenticated','authenticated');
  INSERT INTO public.user_roles(user_id,role) VALUES(uid,'owner') ON CONFLICT(user_id) DO UPDATE SET role='owner';
  IF NOT public.has_role(uid,'admin') THEN RAISE EXCEPTION 'Owner insert must grant hiring admin'; END IF;
  UPDATE public.user_roles SET role='member' WHERE user_id=uid;
  IF public.has_role(uid,'admin') THEN RAISE EXCEPTION 'Owner removal by update must revoke hiring admin'; END IF;
  UPDATE public.user_roles SET role='owner' WHERE user_id=uid;
  IF NOT public.has_role(uid,'admin') THEN RAISE EXCEPTION 'Owner update must grant hiring admin'; END IF;
  INSERT INTO public.hiring_user_roles(user_id,role) VALUES(uid,'reviewer');
  DELETE FROM public.user_roles WHERE user_id=uid;
  IF public.has_role(uid,'admin') THEN RAISE EXCEPTION 'Owner deletion must revoke hiring admin'; END IF;
  IF NOT public.has_role(uid,'reviewer') THEN RAISE EXCEPTION 'Unrelated hiring roles must remain unchanged'; END IF;
  RAISE EXCEPTION USING ERRCODE='ZX001', MESSAGE='Rollback successful role fixtures';
 EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL;
 END;
 IF EXISTS(SELECT 1 FROM public.user_roles r WHERE r.role::text='owner' AND NOT public.has_role(r.user_id,'admin')) THEN RAISE EXCEPTION 'Every existing owner must have hiring admin'; END IF;
END $$;