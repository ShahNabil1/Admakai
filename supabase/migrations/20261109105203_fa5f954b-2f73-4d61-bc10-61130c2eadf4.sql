DELETE FROM public.staff_invites WHERE lower(email) = 'nusratfarjanaakter03@gmail.com';
DELETE FROM public.hiring_user_roles WHERE user_id IN (SELECT id FROM auth.users WHERE lower(email) = 'nusratfarjanaakter03@gmail.com');
DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM auth.users WHERE lower(email) = 'nusratfarjanaakter03@gmail.com') AND role IN ('owner','manager','member');