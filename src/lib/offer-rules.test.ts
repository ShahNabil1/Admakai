import { describe, expect, it } from 'vitest';
import { barOffer, countdown, dhakaInputToIso, discountedRange, isOfferLive, isoToDhakaInput, offerEndLabel, offerStatus, overlapWarnings, parseDismissed, safeCtaLink, winningOffer, type PublicOffer } from './offer-rules';
import { offerPriceInfo } from '@/components/offers/OfferPrice';

const NOW = Date.parse('2026-11-27T06:00:00Z');
const offer = (patch: Partial<PublicOffer>): PublicOffer => ({
  id: 'a', slug: 'a', preset: 'black_friday', headline: 'Black Friday: 50% off every service', shortBadge: 'Black Friday 50% off', discountPercent: 50,
  appliesTo: 'everything', serviceSlugs: [], planSlugs: [], startsAt: '2026-11-26T00:00:00Z', endsAt: '2026-11-30T18:00:00Z', isActive: true, priority: 0,
  showBar: true, showCountdown: true, ctaText: 'Claim now', ctaLink: '/pricing', theme: { background: '#0B0B0C', text: '#FFFFFF', accent: '#FFD43B', badge: '#FFD43B' }, ...patch,
});

describe('offer liveness', () => {
  it('is live only when switched on and inside its dates', () => {
    expect(isOfferLive(offer({}), NOW)).toBe(true);
    expect(isOfferLive(offer({ isActive: false }), NOW)).toBe(false);
    expect(isOfferLive(offer({ startsAt: '2026-11-28T00:00:00Z' }), NOW)).toBe(false);
    expect(isOfferLive(offer({ endsAt: '2026-11-27T05:59:59Z' }), NOW)).toBe(false);
  });
  it('an empty end date runs until turned off', () => {
    expect(isOfferLive(offer({ endsAt: null }), Date.parse('2030-01-01T00:00:00Z'))).toBe(true);
  });
  it('reports Scheduled, Live, Ended and Off', () => {
    expect(offerStatus(offer({ startsAt: '2026-12-01T00:00:00Z', endsAt: null }), NOW)).toBe('scheduled');
    expect(offerStatus(offer({}), NOW)).toBe('live');
    expect(offerStatus(offer({ endsAt: '2026-11-27T00:00:00Z' }), NOW)).toBe('ended');
    expect(offerStatus(offer({ isActive: false }), NOW)).toBe('off');
  });
});

describe('winning offer', () => {
  it('highest priority wins and offers never stack', () => {
    const low = offer({ id: 'low', priority: 1, discountPercent: 50 });
    const high = offer({ id: 'high', priority: 5, discountPercent: 20 });
    expect(winningOffer([low, high], 'service', 'ai-ugc-ads', NOW)?.id).toBe('high');
  });
  it('selected offers only cover their picked items', () => {
    const picked = offer({ id: 'p', appliesTo: 'selected', serviceSlugs: ['ai-ugc-ads'], priority: 9 });
    expect(winningOffer([picked], 'service', 'ai-ugc-ads', NOW)?.id).toBe('p');
    expect(winningOffer([picked], 'service', 'ai-voiceover', NOW)).toBeNull();
    expect(winningOffer([offer({ appliesTo: 'plans' })], 'service', 'ai-ugc-ads', NOW)).toBeNull();
  });
  it('the bar uses the highest-priority live offer that shows a bar', () => {
    expect(barOffer([offer({ id: 'x', priority: 9, showBar: false }), offer({ id: 'y', priority: 1 })], NOW)?.id).toBe('y');
  });
});

describe('discounted prices', () => {
  it('discounts both ends of a range: BDT 6,000 to 8,000 at 50% becomes BDT 3,000 to 4,000', () => {
    expect(discountedRange(6000, 8000, 50, 'BDT', 1)).toEqual({ min: 3000, max: 4000 });
  });
  it('rounds discounted BDT to the nearest 50', () => {
    // USD 290 to 440 at 123 BDT, 50% off: 17,835 and 27,060
    expect(discountedRange(290, 440, 50, 'BDT', 123)).toEqual({ min: 17850, max: 27050 });
  });
  it('keeps the stored base price and shows the original struck through', () => {
    const info = offerPriceInfo(offer({}), 290, 440, 'USD', 1);
    expect(info.original).toBe('$290 to $440');
    expect(info.current).toBe('$145 to $220');
    expect(info.savings).toBe('$145 to $220');
    expect(offerPriceInfo(null, 290, 440, 'USD', 1).current).toBe('$290 to $440');
  });
});

describe('dates and helpers', () => {
  it('shows the end date in Dhaka, or Limited time', () => {
    expect(offerEndLabel('2026-11-30T18:00:00Z')).toBe('Offer ends 1 Dec');
    expect(offerEndLabel('2026-11-30T12:00:00Z')).toBe('Offer ends 30 Nov');
    expect(offerEndLabel(null)).toBe('Limited time');
  });
  it('counts down days, hours, minutes and seconds', () => {
    expect(countdown('2026-11-29T20:36:09Z', NOW)).toEqual({ days: 2, hours: 14, minutes: 36, seconds: 9 });
  });
  it('treats admin dates as Dhaka time', () => {
    expect(dhakaInputToIso('2026-11-27T00:00')).toBe('2026-11-26T18:00:00.000Z');
    expect(isoToDhakaInput('2026-11-26T18:00:00.000Z')).toBe('2026-11-27T00:00');
  });
  it('only allows same-site button links', () => {
    expect(safeCtaLink('/book')).toBe('/book');
    expect(safeCtaLink('//evil.example')).toBe('/pricing');
    expect(safeCtaLink('javascript:alert(1)')).toBe('/pricing');
  });
  it('remembers closed offers per offer id only', () => {
    expect(parseDismissed('["11111111-1111-4111-8111-111111111111","bad"]')).toEqual(['11111111-1111-4111-8111-111111111111']);
    expect(parseDismissed('not json')).toEqual([]);
  });
  it('warns when two switched-on offers overlap on the same items and names the winner', () => {
    const base = { isActive: true, startsAt: '2026-11-26T00:00:00Z', endsAt: '2026-11-30T00:00:00Z', serviceSlugs: [], planSlugs: [] };
    const w = overlapWarnings([{ ...base, id: 'a', name: 'Black Friday', priority: 5, appliesTo: 'everything' }, { ...base, id: 'b', name: 'Flash', priority: 1, appliesTo: 'plans' }], NOW);
    expect(w).toHaveLength(1);
    expect(w[0]?.winner).toBe('a');
    expect(overlapWarnings([{ ...base, id: 'a', name: 'A', priority: 1, appliesTo: 'services' }, { ...base, id: 'b', name: 'B', priority: 1, appliesTo: 'plans' }], NOW)).toHaveLength(0);
  });
});
