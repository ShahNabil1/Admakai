-- Pre-approved staff invites: grant a role the moment a verified account with that email exists.
CREATE TABLE IF NOT EXISTS public.staff_invites (
  email text PRIMARY KEY CHECK (email = lower(btrim(email)) AND email <> ''),
  role public.user_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed_by uuid,
  claimed_at timestamptz
);
REVOKE ALL ON public.staff_invites FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.staff_invites TO service_role;
ALTER TABLE public.staff_invites ENABLE ROW LEVEL SECURITY;
-- No policies: only database triggers and the service role can read or change invites.

CREATE OR REPLACE FUNCTION public.apply_staff_invite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE _invite public.staff_invites;
BEGIN
  IF NEW.email_confirmed_at IS NULL OR NEW.email IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO _invite FROM public.staff_invites
   WHERE email = lower(btrim(NEW.email)) AND claimed_at IS NULL
   FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _invite.role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
  UPDATE public.staff_invites SET claimed_by = NEW.id, claimed_at = now() WHERE email = _invite.email;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.apply_staff_invite() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS zz_apply_staff_invite_insert ON auth.users;
CREATE TRIGGER zz_apply_staff_invite_insert AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.apply_staff_invite();
DROP TRIGGER IF EXISTS zz_apply_staff_invite_confirm ON auth.users;
CREATE TRIGGER zz_apply_staff_invite_confirm AFTER UPDATE OF email_confirmed_at, email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.apply_staff_invite();

-- Rollback-only proof with a synthetic user.
DO $$
DECLARE _id uuid := gen_random_uuid(); _role text; _hiring boolean;
BEGIN
  INSERT INTO public.staff_invites(email, role) VALUES ('invite-proof@admakai.test', 'owner');
  INSERT INTO auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
  VALUES (_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'Invite-Proof@admakai.test', now(), '{}', '{}', now(), now());
  SELECT role::text INTO _role FROM public.user_roles WHERE user_id = _id;
  SELECT public.has_role(_id, 'admin') INTO _hiring;
  IF _role IS DISTINCT FROM 'owner' OR NOT _hiring THEN RAISE EXCEPTION 'invite proof failed: % %', _role, _hiring; END IF;
  RAISE EXCEPTION 'invite_proof_ok';
EXCEPTION WHEN raise_exception THEN
  IF SQLERRM <> 'invite_proof_ok' THEN RAISE; END IF;
END $$;

-- Approved Admakai owners.
INSERT INTO public.staff_invites (email, role) VALUES
  ('ishita@brantatech.com', 'owner'),
  ('nasrin@brantatech.com', 'owner'),
  ('naimul@brantatech.com', 'owner'),
  ('shahi@brantatech.com', 'owner'),
  ('nahid@brantatech.com', 'owner')
ON CONFLICT (email) DO NOTHING;

-- Apply immediately to anyone who already has a verified account.
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'owner'::public.user_role FROM auth.users u
 WHERE lower(u.email) IN ('ishita@brantatech.com','nasrin@brantatech.com','naimul@brantatech.com','shahi@brantatech.com','nahid@brantatech.com')
   AND u.email_confirmed_at IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

UPDATE public.staff_invites i SET claimed_by = u.id, claimed_at = now()
  FROM auth.users u
 WHERE lower(u.email) = i.email AND u.email_confirmed_at IS NOT NULL AND i.claimed_at IS NULL;