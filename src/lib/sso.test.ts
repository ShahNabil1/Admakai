import { describe, expect, it } from 'vitest';
import { buildHubSsoUrl, isStaffRole, parseSsoFragment } from './sso';

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
    'https://admakai.lovable.app',
    'https://id-preview--501d0449-9e53-4830-89e1-c51ec60b3911.lovable.app',
    'https://project--501d0449-9e53-4830-89e1-c51ec60b3911-dev.lovable.app',
  ])('returns sign-in to the same Admakai origin: %s', (origin) => {
    const url = new URL(buildHubSsoUrl(origin, 'test-state'));
    expect(url.origin).toBe('https://console.brantatech.com');
    expect(url.pathname).toBe('/sso/admakai');
    expect(url.searchParams.get('redirect_uri')).toBe(`${origin}/auth/sso/callback`);
    expect(url.searchParams.get('state')).toBe('test-state');
  });
});
