import { describe, expect, it } from 'vitest';
import { accountBadge, initials, legacyAccountPath, primaryStatus, safeReturnPath, signedInHome } from './account-rules';

describe('sign-in destination', () => {
  it('returns to the page the user came from', () => expect(signedInHome(false, '/careers/intern/apply')).toBe('/careers/intern/apply'));
  it('sends owners and hiring staff to /admin', () => expect(signedInHome(true)).toBe('/admin'));
  it('sends everyone else to /dashboard', () => expect(signedInHome(false)).toBe('/dashboard'));
  it('rejects external and protocol-relative redirects', () => {
    expect(safeReturnPath('https://evil.test')).toBeUndefined();
    expect(safeReturnPath('//evil.test')).toBeUndefined();
    expect(safeReturnPath('/\\evil.test')).toBeUndefined();
    expect(safeReturnPath('/signin?redirect=/x')).toBeUndefined();
  });
});

describe('old account links', () => {
  it.each([
    ['/me', '/dashboard'],
    ['/me/applications/0b8d7c4e-1111-4222-8333-444455556666', '/dashboard/applications/0b8d7c4e-1111-4222-8333-444455556666'],
    ['/me/journey', '/dashboard/journey'],
    ['/me/documents', '/dashboard/documents'],
    ['/me/profile', '/dashboard/profile'],
    ['/me/login', '/signin'],
    ['/app', '/dashboard'],
    ['/app/calls', '/dashboard/calls'],
    ['/app/projects', '/dashboard'],
    ['/app/reviews', '/dashboard'],
    ['/app/files', '/dashboard'],
    ['/app/billing', '/dashboard'],
  ])('%s goes to %s', (from, to) => expect(legacyAccountPath(from)).toBe(to));
});

describe('account badge', () => {
  it('owner', () => expect(accountBadge({ role: 'owner', hiringAdmin: true })).toBe('Owner'));
  it('hiring admin', () => expect(accountBadge({ role: 'client', hiringAdmin: true })).toBe('Admin'));
  it('team', () => expect(accountBadge({ role: 'client', hiringStaff: true })).toBe('Team'));
  it('hired member', () => expect(accountBadge({ role: 'client', member: true })).toBe('Member'));
  it('no badge otherwise', () => expect(accountBadge({ role: 'client' })).toBeNull());
});

describe('status card', () => {
  it('shows the sooner of a call and an interview', () => {
    expect(primaryStatus({ call: { at: '2026-11-10T04:00:00Z' }, interview: { at: '2026-11-09T04:00:00Z', title: 'Intern' } })?.kind).toBe('interview');
  });
  it('falls back to the latest application before the journey', () => {
    expect(primaryStatus({ application: { label: 'Shortlisted', title: 'Intern', id: 'a' }, journey: { label: 'Learner', day: 3, expected: 30 } })?.kind).toBe('application');
  });
  it('uses initials from the name, then email', () => { expect(initials('Tanzil Ahmed')).toBe('TA'); expect(initials('', 'z@x.com')).toBe('Z'); });
});
