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
    expect(buildHubSsoUrl('https://admakai.com', 's')).toBe('https://branta-nexus.lovable.app/sso/admakai?redirect_uri=https%3A%2F%2Fadmakai.com%2Fauth%2Fsso%2Fcallback&state=s');
  });
});
