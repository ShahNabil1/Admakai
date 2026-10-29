import { z } from 'zod';

export const needs = [{ value: 'tvc', label: 'TVC' }, { value: 'product_photos', label: 'Product photos' }, { value: 'ugc', label: 'UGC pack' }, { value: 'brand_face', label: 'Brand face' }, { value: 'unsure', label: 'Not sure yet' }] as const;
export const budgets = [{ value: 'not_decided', label: 'Not decided' }, { value: '30k_80k', label: '30k to 80k' }, { value: '80k_plus', label: '80k and above' }] as const;
export function normalizeBookingPhone(value: string) {
  const phone = normalizePhoneInput(value).replace(/[\s()-]/g, '');
  if (/^01[3-9]\d{8}$/.test(phone)) return `+88${phone}`;
  if (/^1[3-9]\d{8}$/.test(phone)) return `+880${phone}`;
  if (/^8801[3-9]\d{8}$/.test(phone)) return `+${phone}`;
  return phone;
}
const NON_ASCII_DIGITS: Record<string, string> = {};
for (const [base, zero] of [[0x09e6, '০'], [0x0660, '٠'], [0x06f0, '۰'], [0x0966, '०'], [0xff10, '０']] as const) for (let i = 0; i < 10; i++) NON_ASCII_DIGITS[String.fromCodePoint(base + i)] = String(i);
export function normalizePhoneInput(value: string) {
  const ascii = [...value].map(char => NON_ASCII_DIGITS[char] ?? char).join('');
  return ascii.replace(/[^\d+\-() ]/g, '');
}
export const bookingFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.').max(100, 'Keep your name under 100 characters.'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(254),
  whatsapp: z.string().max(30).transform(normalizeBookingPhone).refine(value => /^\+[1-9]\d{9,14}$/.test(value), 'Enter at least 10 digits; use +country code outside Bangladesh.'),
  brand: z.string().trim().max(150, 'Keep the brand name under 150 characters.'),
  need: z.enum(['tvc', 'product_photos', 'ugc', 'brand_face', 'unsure']),
  message: z.string().trim().max(2000, 'Keep the message under 2,000 characters.'),
  budget: z.enum(['not_decided', '30k_80k', '80k_plus']),
});
export type BookingFields = z.input<typeof bookingFormSchema>;
export type BookingDetails = z.output<typeof bookingFormSchema>;
export const slotSchema = z.object({ slot_at: z.string().datetime({ offset: true }), local_day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), local_time: z.string().regex(/^\d{2}:\d{2}:\d{2}/) });
export type OpenSlot = z.infer<typeof slotSchema>;
export function groupSlots(slots: OpenSlot[]) {
  const groups = new Map<string, OpenSlot[]>();
  for (const slot of slots) groups.set(slot.local_day, [...(groups.get(slot.local_day) ?? []), slot]);
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}
export function skipSpam(honeypot: string, mountedAt: number, now: number) { return honeypot.length > 0 || now - mountedAt < 3000; }
export function captureBookingSource(url: string, referrer: string, userAgent: string) {
  const parsed = new URL(url);
  const source: Record<string, string> = { referrer: referrer.slice(0, 2000), landing_pathname: parsed.pathname.slice(0, 500), user_agent: userAgent.slice(0, 1000) };
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) source[key] = (parsed.searchParams.get(key) ?? '').slice(0, 200);
  return source;
}
export function dayLabel(day: string, long = false) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', weekday: long ? 'long' : 'short', day: 'numeric', month: 'short', ...(long ? { year: 'numeric' as const } : {}) }).format(new Date(`${day}T12:00:00+06:00`));
}
export function timeLabel(time: string) { return time.slice(0, 5); }