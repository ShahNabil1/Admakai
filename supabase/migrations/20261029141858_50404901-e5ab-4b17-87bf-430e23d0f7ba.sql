CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE TABLE app.password_history (
 id bigserial PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 password_hash text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON app.password_history FROM PUBLIC, anon, authenticated;
GRANT ALL ON app.password_history TO service_role;
ALTER TABLE app.password_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX password_history_user_idx ON app.password_history(user_id);

CREATE FUNCTION app.remember_old_password() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF OLD.encrypted_password IS NOT NULL AND OLD.encrypted_password <> '' AND OLD.encrypted_password IS DISTINCT FROM NEW.encrypted_password THEN
  INSERT INTO app.password_history(user_id, password_hash) VALUES (OLD.id, OLD.encrypted_password);
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION app.remember_old_password() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_auth_password_changed AFTER UPDATE OF encrypted_password ON auth.users
FOR EACH ROW EXECUTE FUNCTION app.remember_old_password();

CREATE FUNCTION public.password_previously_used(p_password text) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE uid uuid := auth.uid();
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
 RETURN EXISTS (SELECT 1 FROM auth.users u WHERE u.id = uid AND u.encrypted_password <> '' AND u.encrypted_password = extensions.crypt(p_password, u.encrypted_password))
  OR EXISTS (SELECT 1 FROM app.password_history h WHERE h.user_id = uid AND h.password_hash = extensions.crypt(p_password, h.password_hash));
END;
$$;
REVOKE ALL ON FUNCTION public.password_previously_used(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.password_previously_used(text) TO authenticated;