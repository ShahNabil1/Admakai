CREATE TYPE public.user_role AS ENUM ('owner', 'manager', 'member', 'client');
CREATE TYPE public.booking_status AS ENUM ('requested', 'in_review', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled');
CREATE TYPE public.lead_stage AS ENUM ('new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost');
CREATE TYPE public.project_stage AS ENUM ('brief', 'script', 'assets', 'first_cut', 'revision', 'final', 'delivered');
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'in_review', 'done', 'blocked');
CREATE TYPE public.deliverable_status AS ENUM ('submitted', 'changes_requested', 'resubmitted', 'approved');
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'void');

CREATE TABLE public.profiles (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 full_name text,
 email text NOT NULL,
 whatsapp text,
 avatar_url text,
 timezone text NOT NULL DEFAULT 'Asia/Dhaka',
 is_active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 role public.user_role NOT NULL DEFAULT 'client',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.user_roles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_roles_read_own ON public.user_roles FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

CREATE FUNCTION public.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
 NEW.updated_at := now();
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER profiles_touch_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER user_roles_touch_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 INSERT INTO public.profiles (user_id, email, full_name, whatsapp)
 VALUES (NEW.id, COALESCE(NEW.email, ''), COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), NEW.raw_user_meta_data->>'name'), NEW.raw_user_meta_data->>'whatsapp')
 ON CONFLICT (user_id) DO NOTHING;
 INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client'::public.user_role)
 ON CONFLICT (user_id) DO NOTHING;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE SCHEMA app;
REVOKE ALL ON SCHEMA app FROM PUBLIC;
GRANT USAGE ON SCHEMA app TO authenticated, service_role;
CREATE FUNCTION app.my_role() RETURNS public.user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT role FROM public.user_roles WHERE user_id = (SELECT auth.uid())
$$;
CREATE FUNCTION app.is_staff() RETURNS boolean
LANGUAGE sql STABLE SET search_path = '' AS $$
 SELECT COALESCE(app.my_role() IN ('owner'::public.user_role, 'manager'::public.user_role, 'member'::public.user_role), false)
$$;
CREATE FUNCTION app.is_manager() RETURNS boolean
LANGUAGE sql STABLE SET search_path = '' AS $$
 SELECT COALESCE(app.my_role() IN ('owner'::public.user_role, 'manager'::public.user_role), false)
$$;
REVOKE ALL ON FUNCTION app.my_role(), app.is_staff(), app.is_manager() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app.my_role(), app.is_staff(), app.is_manager() TO authenticated, service_role;

CREATE POLICY profiles_read ON public.profiles FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR (SELECT app.is_staff()));
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid()) OR (SELECT app.is_manager())) WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT app.is_manager()));
CREATE POLICY profiles_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));

-- Runtime regression tests: all synthetic users and profile changes are rolled back.
DO $$
DECLARE
 client_id uuid := gen_random_uuid();
 member_id uuid := gen_random_uuid();
 manager_id uuid := gen_random_uuid();
 owner_id uuid := gen_random_uuid();
 row_count integer;
 actual_time timestamptz;
BEGIN
 BEGIN
  INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
   (client_id, 'foundation-client@example.invalid', '{"full_name":"Full name","name":"Fallback name","whatsapp":"01700000000","role":"owner"}'::jsonb),
   (member_id, 'foundation-member@example.invalid', '{"name":"Fallback name"}'::jsonb),
   (manager_id, 'foundation-manager@example.invalid', '{}'::jsonb),
   (owner_id, 'foundation-owner@example.invalid', '{}'::jsonb);
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id=client_id AND full_name='Full name' AND email='foundation-client@example.invalid' AND whatsapp='01700000000' AND timezone='Asia/Dhaka' AND is_active) THEN RAISE EXCEPTION 'Signup profile fields/defaults failed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id=member_id AND full_name='Fallback name') THEN RAISE EXCEPTION 'Signup name fallback failed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=client_id AND role='client') THEN RAISE EXCEPTION 'Signup must ignore metadata role'; END IF;
  UPDATE public.user_roles SET role='member' WHERE user_id=member_id;
  UPDATE public.user_roles SET role='manager' WHERE user_id=manager_id;
  UPDATE public.user_roles SET role='owner' WHERE user_id=owner_id;
  PERFORM set_config('request.jwt.claim.sub', client_id::text, true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub',client_id,'role','authenticated')::text,true);
  SET LOCAL ROLE authenticated;
  IF app.my_role() <> 'client' OR app.is_staff() OR app.is_manager() THEN RAISE EXCEPTION 'Client helper results failed'; END IF;
  SELECT count(*) INTO row_count FROM public.profiles WHERE user_id IN (client_id,member_id,manager_id,owner_id);
  IF row_count <> 1 THEN RAISE EXCEPTION 'Client must only read own profile'; END IF;
  UPDATE public.profiles SET full_name='Edited', updated_at='2000-01-01' WHERE user_id=client_id RETURNING updated_at INTO actual_time;
  IF actual_time IS DISTINCT FROM now() THEN RAISE EXCEPTION 'Self update or timestamp trigger failed'; END IF;
  UPDATE public.profiles SET full_name='Forbidden' WHERE user_id=member_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  IF row_count <> 0 THEN RAISE EXCEPTION 'Client edited another profile'; END IF;
  BEGIN
   UPDATE public.user_roles SET role='owner' WHERE user_id=client_id;
   RAISE EXCEPTION 'Client changed their role';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
   INSERT INTO public.profiles(user_id,email) VALUES(gen_random_uuid(),'forbidden@example.invalid');
   RAISE EXCEPTION 'Client inserted another profile';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', member_id::text,true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub',member_id,'role','authenticated')::text,true);
  SET LOCAL ROLE authenticated;
  IF app.my_role()<>'member' OR NOT app.is_staff() OR app.is_manager() THEN RAISE EXCEPTION 'Member helper results failed'; END IF;
  SELECT count(*) INTO row_count FROM public.profiles WHERE user_id IN (client_id,member_id,manager_id,owner_id);
  IF row_count <> 4 THEN RAISE EXCEPTION 'Staff must read all profiles'; END IF;
  UPDATE public.profiles SET full_name='Forbidden' WHERE user_id=client_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  IF row_count <> 0 THEN RAISE EXCEPTION 'Member edited another profile'; END IF;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', manager_id::text,true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub',manager_id,'role','authenticated')::text,true);
  SET LOCAL ROLE authenticated;
  IF app.my_role()<>'manager' OR NOT app.is_staff() OR NOT app.is_manager() THEN RAISE EXCEPTION 'Manager helper results failed'; END IF;
  UPDATE public.profiles SET full_name='Manager edit' WHERE user_id=client_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  IF row_count <> 1 THEN RAISE EXCEPTION 'Manager must edit other profiles'; END IF;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', owner_id::text,true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub',owner_id,'role','authenticated')::text,true);
  SET LOCAL ROLE authenticated;
  IF app.my_role()<>'owner' OR NOT app.is_staff() OR NOT app.is_manager() THEN RAISE EXCEPTION 'Owner helper results failed'; END IF;
  UPDATE public.profiles SET full_name='Owner edit' WHERE user_id=client_id;
  GET DIAGNOSTICS row_count = ROW_COUNT;
  IF row_count <> 1 THEN RAISE EXCEPTION 'Owner must edit other profiles'; END IF;
  RESET ROLE;
  RAISE EXCEPTION USING ERRCODE='Z0001', MESSAGE='Rollback successful foundation tests';
 EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL;
 END;
END;
$$;