INSERT INTO public.staff_invites (email, role) VALUES
  ('nusratfarjanaakter03@gmail.com', 'owner'),
  ('sumaia@brantatech.com', 'owner')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, claimed_at = NULL, claimed_by = NULL;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'owner'::public.user_role
FROM auth.users u
JOIN public.staff_invites i ON i.email = lower(btrim(u.email))
WHERE u.email_confirmed_at IS NOT NULL
  AND i.email IN ('nusratfarjanaakter03@gmail.com', 'sumaia@brantatech.com')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

UPDATE public.staff_invites i
SET claimed_by = u.id, claimed_at = now()
FROM auth.users u
WHERE i.email = lower(btrim(u.email))
  AND u.email_confirmed_at IS NOT NULL
  AND i.claimed_at IS NULL
  AND i.email IN ('nusratfarjanaakter03@gmail.com', 'sumaia@brantatech.com');