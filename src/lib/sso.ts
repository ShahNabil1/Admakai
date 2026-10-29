// Branta Hub single sign-on for Admakai staff. Branta Hub owns staff login;
// Admakai only accepts a session Hub minted for its own Supabase project.
export const BRANTA_HUB_URL = 'https://console.brantatech.com';
export const SSO_STATE_KEY = 'admakai-sso-state';
export const STAFF_ROLES = ['owner', 'manager', 'member'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export function isStaffRole(role: unknown): role is StaffRole {
  return typeof role === 'string' && (STAFF_ROLES as readonly string[]).includes(role);
}

export function buildHubSsoUrl(origin: string, state: string): string {
  const q = new URLSearchParams({ redirect_uri: `${origin}/auth/sso/callback`, state });
  return `${BRANTA_HUB_URL}/sso/admakai?${q.toString()}`;
}

export type SsoFragment = { access_token: string; refresh_token: string; state: string } | { error: string };

export function parseSsoFragment(hash: string, expectedState: string | null): SsoFragment {
  const p = new URLSearchParams(hash.replace(/^#/, ''));
  const access_token = p.get('access_token');
  const refresh_token = p.get('refresh_token');
  const state = p.get('state');
  if (p.get('error')) return { error: p.get('error_description') || 'Branta Hub refused the sign-in.' };
  if (!access_token || !refresh_token) return { error: 'The sign-in link is incomplete.' };
  if (!expectedState || state !== expectedState) return { error: 'This sign-in link has expired. Please try again.' };
  return { access_token, refresh_token, state };
}

export function startHubSignIn() {
  const state = crypto.randomUUID();
  sessionStorage.setItem(SSO_STATE_KEY, state);
  window.location.assign(buildHubSsoUrl(window.location.origin, state));
}
