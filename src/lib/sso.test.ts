import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildHubSsoUrl, cancelHubPopupSignIn, isStaffRole, parseSsoFragment, readSsoState, SSO_MESSAGE_TYPE, SSO_STATE_KEY, ssoResultMessage, startHubPopupSignIn } from './sso';

describe('Branta Hub SSO', () => {
  it('only owner, manager and member are staff', () => {
    expect(isStaffRole('owner')).toBe(true);
    expect(isStaffRole('member')).toBe(true);
    expect(isStaffRole('client')).toBe(false);
  });
  it('rejects a fragment whose state does not match', () => {
    expect(parseSsoFragment('#access_token=a&refresh_token=b&state=x', 'y')).toHaveProperty('error');
  });
  it('accepts a matching fragment', () => {
    expect(parseSsoFragment('#access_token=a&refresh_token=b&state=x', 'x')).toEqual({ access_token: 'a', refresh_token: 'b', state: 'x' });
  });
  it('sends staff to the Hub admakai SSO page with the callback', () => {
    expect(buildHubSsoUrl('https://admakai.com', 's')).toBe('https://console.brantatech.com/sso/admakai?redirect_uri=https%3A%2F%2Fadmakai.com%2Fauth%2Fsso%2Fcallback&state=s');
  });
  it.each([
    'https://admakai.com',
    'https://www.admakai.com',
    'https://preview.admakai.example',
    'http://localhost:8080',
  ])('returns sign-in to the same Admakai origin: %s', (origin) => {
    const url = new URL(buildHubSsoUrl(origin, 'test-state'));
    expect(url.origin).toBe('https://console.brantatech.com');
    expect(url.pathname).toBe('/sso/admakai');
    expect(url.searchParams.get('redirect_uri')).toBe(`${origin}/auth/sso/callback`);
    expect(url.searchParams.get('state')).toBe('test-state');
  });
});

describe('Popup SSO security and lifecycle', () => {
  afterEach(() => {
    cancelHubPopupSignIn();
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function openPopup() {
    vi.useFakeTimers();
    vi.stubGlobal('crypto', { randomUUID: () => 'popup-state' });
    const popup = { closed: false, close: vi.fn() };
    vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);
    const clearPoll = vi.spyOn(globalThis, 'clearInterval');
    const clearDeadline = vi.spyOn(globalThis, 'clearTimeout');
    const promise = startHubPopupSignIn();
    return { popup, promise, clearPoll, clearDeadline };
  }
  function send(source: unknown, origin = window.location.origin, state = 'popup-state', ok = true) {
    window.dispatchEvent(new MessageEvent('message', {
      origin, source: source as Window,
      data: { type: SSO_MESSAGE_TYPE, state, ok },
    }));
  }

  it('rejects stored state after exactly ten minutes', () => {
    localStorage.setItem(SSO_STATE_KEY, JSON.stringify({ state: 's', mode: 'popup', createdAt: Date.now() - 600000 }));
    expect(readSsoState()).toBeNull();
    expect(parseSsoFragment('#access_token=a&refresh_token=b&state=s', readSsoState()?.state ?? null)).toHaveProperty('error');
  });
  it('accepts recent shared-storage state and rejects missing state', () => {
    expect(readSsoState()).toBeNull();
    localStorage.setItem(SSO_STATE_KEY, JSON.stringify({ state: 's', mode: 'redirect', createdAt: Date.now() }));
    expect(readSsoState()?.state).toBe('s');
  });
  it.each(['origin', 'source', 'state'])('ignores a message with the wrong %s', async (wrong) => {
    const { popup, promise, clearPoll, clearDeadline } = openPopup();
    const settled = vi.fn();
    void promise.then(settled);
    send(wrong === 'source' ? window : popup, wrong === 'origin' ? 'https://attacker.example' : window.location.origin, wrong === 'state' ? 'wrong' : 'popup-state');
    await Promise.resolve();
    expect(settled).not.toHaveBeenCalled();
    send(popup);
    await expect(promise).resolves.toBe('success');
    expect(clearPoll).toHaveBeenCalled();
    expect(clearDeadline).toHaveBeenCalled();
  });
  it('constructs result messages without any access or refresh token fields', () => {
    expect(ssoResultMessage('s', true)).toEqual({ type: 'admakai-sso-result', state: 's', ok: true });
    expect(ssoResultMessage('s', false, 'Access denied')).toEqual({ type: 'admakai-sso-result', state: 's', ok: false, error: 'Access denied' });
  });
  it('returns blocked when the browser refuses the popup', async () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'popup-state' });
    vi.spyOn(window, 'open').mockReturnValue(null);
    await expect(startHubPopupSignIn()).resolves.toBe('blocked');
    expect(readSsoState()).toBeNull();
  });
  it('detects closure within 500 milliseconds and removes timers', async () => {
    const { popup, promise, clearPoll, clearDeadline } = openPopup();
    popup.closed = true;
    await vi.advanceTimersByTimeAsync(500);
    await expect(promise).resolves.toBe('closed');
    expect(clearPoll).toHaveBeenCalled();
    expect(clearDeadline).toHaveBeenCalled();
  });
  it('cancels and closes the popup', async () => {
    const { popup, promise } = openPopup();
    cancelHubPopupSignIn();
    await expect(promise).resolves.toBe('closed');
    expect(popup.close).toHaveBeenCalledOnce();
    expect(readSsoState()).toBeNull();
  });
  it('times out after ten minutes', async () => {
    const { popup, promise, clearPoll, clearDeadline } = openPopup();
    await vi.advanceTimersByTimeAsync(600000);
    await expect(promise).resolves.toEqual({ error: 'Sign-in timed out. Please try again.' });
    expect(popup.close).toHaveBeenCalledOnce();
    expect(clearPoll).toHaveBeenCalled();
    expect(clearDeadline).toHaveBeenCalled();
  });
  it('returns a verified callback error', async () => {
    const { popup, promise } = openPopup();
    send(popup, window.location.origin, 'popup-state', false);
    await expect(promise).resolves.toEqual({ error: 'Could not complete sign-in.' });
  });
});
