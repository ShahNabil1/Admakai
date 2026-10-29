import { describe, it, expect } from 'vitest';
import { bookingFormSchema, skipSpam, groupSlots, captureBookingSource, normalizeBookingPhone, needs, budgets } from './booking-form';
const valid = { name: ' Nadia ', email: ' Nadia@Example.com ', whatsapp: '01712-345 678', brand: '', need: 'tvc', message: '', budget: 'not_decided' };
describe('Public booking rules', () => {
  it('requires a name', () => expect(bookingFormSchema.safeParse({ ...valid, name: '  ' }).success).toBe(false));
  it('requires a shaped email', () => expect(bookingFormSchema.safeParse({ ...valid, email: 'invalid' }).success).toBe(false));
  it('rejects fewer than ten phone digits', () => expect(bookingFormSchema.safeParse({ ...valid, whatsapp: '+123456789' }).success).toBe(false));
  it('accepts ten international digits', () => expect(bookingFormSchema.safeParse({ ...valid, whatsapp: '+1234567890' }).success).toBe(true));
  it('normalizes Bangladesh phones to E.164', () => expect(normalizeBookingPhone('01712-345 678')).toBe('+8801712345678'));
  it('normalizes email and allows optional brand/message', () => expect(bookingFormSchema.parse(valid)).toMatchObject({ name: 'Nadia', email: 'nadia@example.com', brand: '', message: '' }));
  it('skips submission before three seconds', () => expect(skipSpam('', 1000, 3999)).toBe(true));
  it('allows submission at three seconds', () => expect(skipSpam('', 1000, 4000)).toBe(false));
  it('skips a filled honeypot', () => expect(skipSpam('https://spam.test', 0, 10000)).toBe(true));
  it('only groups supplied days without generating slots', () => expect(groupSlots([{ slot_at: '2026-10-31T10:00:00+00:00', local_day: '2026-10-31', local_time: '16:00:00' }]).map(([day]) => day)).toEqual(['2026-10-31']));
  it('captures the five UTM fields and landing pathname', () => expect(captureBookingSource('https://admakai.com/book?utm_source=search&utm_medium=cpc&utm_campaign=launch&utm_content=ad&utm_term=ads', '', 'Agent')).toEqual({ utm_source: 'search', utm_medium: 'cpc', utm_campaign: 'launch', utm_content: 'ad', utm_term: 'ads', referrer: '', landing_pathname: '/book', user_agent: 'Agent' }));
  it('uses exactly the requested needs', () => expect(needs.map(item => item.value)).toEqual(['tvc', 'product_photos', 'ugc', 'brand_face', 'unsure']));
  it('uses exactly the requested budget bands', () => expect(budgets.map(item => item.value)).toEqual(['not_decided', '30k_80k', '80k_plus']));
});