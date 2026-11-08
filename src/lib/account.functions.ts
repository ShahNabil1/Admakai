import { createServerFn } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

/** Identity facts for the header account menu and dashboard; every read runs as the signed-in user (RLS). */
export const getAccountSummary = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  setResponseHeader('Cache-Control', 'no-store');
  const db = context.supabase;
  const [profile, role, staff, admin, help] = await Promise.all([
    db.from('profiles').select('full_name,avatar_url,whatsapp,email').eq('user_id', context.userId).maybeSingle(),
    db.from('user_roles').select('role').eq('user_id', context.userId).maybeSingle(),
    db.rpc('is_hiring_staff', { _user_id: context.userId }),
    db.rpc('has_role', { _user_id: context.userId, _role: 'admin' }),
    db.rpc('hiring_public_help'),
  ]);
  const roleName = role.data?.role ?? null;
  const hiringStaff = !staff.error && staff.data === true;
  return {
    fullName: profile.data?.full_name ?? null,
    avatarUrl: profile.data?.avatar_url ?? null,
    whatsapp: profile.data?.whatsapp ?? null,
    role: roleName as string | null,
    hiringStaff,
    hiringAdmin: !admin.error && admin.data === true,
    canOpenAdmin: roleName === 'owner' || hiringStaff,
    helpUrl: typeof help.data === 'string' && /^https:\/\//.test(help.data) ? help.data : null,
  };
});
export type AccountSummary = Awaited<ReturnType<typeof getAccountSummary>>;
