import { describe, expect, it } from 'vitest';
import { browserFrom, clickLabel, continuesSession, deviceFrom, draftWorthSaving, externalHost, formatDuration, percent } from './analytics-rules';

describe('analytics rules', () => {
  it('a visit ends after 30 idle minutes', () => {
    expect(continuesSession(0, 29 * 60_000)).toBe(true);
    expect(continuesSession(0, 30 * 60_000)).toBe(false);
    expect(continuesSession(null, 1)).toBe(false);
  });
  it('unfinished booking is saved only once an email or WhatsApp is typed', () => {
    expect(draftWorthSaving({ name: 'Rafi', email: '', whatsapp: '' })).toBe(false);
    expect(draftWorthSaving({ name: '', email: 'a@b.co', whatsapp: '' })).toBe(true);
    expect(draftWorthSaving({ name: '', email: '', whatsapp: '+880 1711 22' })).toBe(true);
    expect(draftWorthSaving({ name: '', email: 'a@b', whatsapp: '0171' })).toBe(false);
  });
  it('never labels clicks on form fields', () => {
    expect(clickLabel({ tag: 'input', text: 'secret' })).toBeNull();
    expect(clickLabel({ tag: 'a', track: 'Book a call', text: 'x' })).toBe('Book a call');
  });
  it('own-site referrers count as direct', () => {
    expect(externalHost('https://www.admakai.com/x', 'admakai.com')).toBeNull();
    expect(externalHost('https://www.google.com/', 'admakai.com')).toBe('google.com');
  });
  it('detects devices and browsers', () => {
    expect(deviceFrom('Mozilla (iPhone) Mobile')).toBe('phone');
    expect(browserFrom('Chrome/120 Safari/537')).toBe('Chrome');
  });
  it('formats durations and percents', () => {
    expect(formatDuration(75)).toBe('1m 15s');
    expect(percent(1, 3)).toBe(33);
    expect(percent(1, 0)).toBe(0);
  });
});
