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

export const SSO_MESSAGE_TYPE = 'admakai-sso-result';
const SSO_TTL = 10 * 60 * 1000;
type SavedSsoState = { state: string; mode: 'popup' | 'redirect'; createdAt: number };
export type PopupResult = 'success' | 'closed' | 'blocked' | { error: string };

export function clearSsoState() {
  window.localStorage.removeItem(SSO_STATE_KEY);
}

export function readSsoState(): SavedSsoState | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(SSO_STATE_KEY) ?? 'null');
    if (!value || typeof value.state !== 'string' || !value.state ||
      !['popup', 'redirect'].includes(value.mode) || typeof value.createdAt !== 'number' ||
      !Number.isFinite(value.createdAt) || value.createdAt > Date.now() || Date.now() - value.createdAt >= SSO_TTL) {
      clearSsoState();
      return null;
    }
    return value;
  } catch { return null; }
}

function saveSsoState(mode: SavedSsoState['mode']) {
  const state = crypto.randomUUID();
  window.localStorage.setItem(SSO_STATE_KEY, JSON.stringify({ state, mode, createdAt: Date.now() }));
  return state;
}

// Construct a strictly allowlisted message: session credentials never cross postMessage.
export function ssoResultMessage(state: string, ok: boolean, error?: string) {
  return { type: SSO_MESSAGE_TYPE, ok, state, ...(!ok && error ? { error } : {}) };
}

export function startHubSignIn() {
  cancelHubPopupSignIn();
  const state = saveSsoState('redirect');
  window.location.assign(buildHubSsoUrl(window.location.origin, state));
}

let cancelPopup: (() => void) | undefined;
export function cancelHubPopupSignIn() { cancelPopup?.(); }

export function startHubPopupSignIn(): Promise<PopupResult> {
  cancelHubPopupSignIn();
  let state: string;
  let popup: Window | null;
  try {
    state = saveSsoState('popup');
    const left = Math.round(window.screenX + (window.outerWidth - 460) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - 680) / 2);
    popup = window.open(buildHubSsoUrl(window.location.origin, state), 'admakai-sso', `popup,width=460,height=680,left=${left},top=${top}`);
  } catch {
    return Promise.resolve({ error: 'Could not open secure sign-in. Please allow browser storage and try again.' });
  }
  if (!popup) { clearSsoState(); return Promise.resolve('blocked'); }
  const signInWindow = popup;
  return new Promise((resolve) => {
    let finished = false;
    const finish = (result: PopupResult) => {
      if (finished) return;
      finished = true;
      window.removeEventListener('message', onMessage);
      window.clearInterval(poll);
      window.clearTimeout(timeout);
      if (readSsoState()?.state === state) clearSsoState();
      if (cancelPopup === cancel) cancelPopup = undefined;
      resolve(result);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== signInWindow ||
        event.data?.type !== SSO_MESSAGE_TYPE || event.data.state !== state) return;
      if (event.data.ok === true) finish('success');
      else if (event.data.ok === false) finish({ error: typeof event.data.error === 'string' ? event.data.error : 'Could not complete sign-in.' });
    };
    const cancel = () => { signInWindow.close(); finish('closed'); };
    const poll = window.setInterval(() => { if (signInWindow.closed) finish('closed'); }, 500);
    const timeout = window.setTimeout(() => {
      signInWindow.close();
      finish({ error: 'Sign-in timed out. Please try again.' });
    }, SSO_TTL);
    cancelPopup = cancel;
    window.addEventListener('message', onMessage);
  });
}
