/** Browser-safe rules shared by sign in, the header account menu and the dashboard. */

/** Same-origin path to return to after sign in; anything external or auth-related is rejected. */
export function safeReturnPath(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 300) return undefined;
  if (!/^\/(?![/\\])[A-Za-z0-9\-._~/?=&%]*$/.test(value)) return undefined;
  if (/^\/(signin|auth|me\/login)(\/|\?|$)/.test(value)) return undefined;
  return value;
}

/** Where to land after sign in: the requested page, else /admin for staff, else /dashboard. */
export function signedInHome(staff: boolean, redirect?: string) {
  return safeReturnPath(redirect) ?? (staff ? '/admin' : '/dashboard');
}

/** Old candidate (/me) and client (/app) addresses mapped to the shared dashboard. */
export function legacyAccountPath(pathname: string): string | null {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/me/login') return '/signin';
  const app = path.match(/^\/me\/applications\/([a-f0-9-]{36})$/);
  if (app) return `/dashboard/applications/${app[1]}`;
  if (path === '/me' || path === '/me/applications') return '/dashboard';
  const me = path.match(/^\/me\/(journey|documents|profile)$/);
  if (me) return `/dashboard/${me[1]}`;
  if (path === '/app/calls') return '/dashboard/calls';
  if (path === '/app' || path.startsWith('/app/') || path.startsWith('/me/')) return '/dashboard';
  return null;
}

export type AccountBadge = 'Owner' | 'Admin' | 'Team' | 'Member' | null;
export function accountBadge(a: { role?: string | null | undefined; hiringAdmin?: boolean | undefined; hiringStaff?: boolean | undefined; member?: boolean | undefined }): AccountBadge {
  if (a.role === 'owner') return 'Owner';
  if (a.hiringAdmin) return 'Admin';
  if (a.role === 'manager' || a.role === 'member' || a.hiringStaff) return 'Team';
  if (a.member) return 'Member';
  return null;
}

export function initials(name?: string | null, email?: string | null) {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length) return words.slice(0, 2).map(w => w[0]!.toUpperCase()).join('');
  return (email?.[0] ?? '?').toUpperCase();
}

export type StatusCard =
  | { kind: 'call'; at: string; title: string }
  | { kind: 'interview'; at: string; title: string }
  | { kind: 'application'; label: string; title: string; id: string }
  | { kind: 'journey'; label: string; day: number; expected: number | null };

/** The single most urgent card: the soonest upcoming call or interview, then latest application, then journey stage. */
export function primaryStatus(input: {
  call?: { at: string } | null;
  interview?: { at: string; title: string } | null;
  application?: { label: string; title: string; id: string } | null;
  journey?: { label: string; day: number; expected: number | null } | null;
}): StatusCard | null {
  const { call, interview } = input;
  if (call && interview) return Date.parse(interview.at) < Date.parse(call.at) ? { kind: 'interview', ...interview } : { kind: 'call', at: call.at, title: 'Call with Admakai' };
  if (interview) return { kind: 'interview', ...interview };
  if (call) return { kind: 'call', at: call.at, title: 'Call with Admakai' };
  if (input.application) return { kind: 'application', ...input.application };
  if (input.journey) return { kind: 'journey', ...input.journey };
  return null;
}
