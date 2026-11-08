// Browser-safe rules for booking and enquiry emails.
export const CRM_TRIGGERS = ['booking_requested', 'booking_confirmed', 'booking_rescheduled', 'booking_cancelled', 'booking_reminder', 'booking_new_admin', 'enquiry_received', 'enquiry_new_admin'] as const;
export function emailTemplateGroup(trigger: string) {
  return trigger.startsWith('booking_') || trigger.startsWith('enquiry_') ? 'Bookings and enquiries' : 'Hiring';
}
/** Which client email a staff status change sends, if any. */
export function bookingStatusTrigger(status: string) {
  return ({ confirmed: 'booking_confirmed', rescheduled: 'booking_rescheduled', cancelled: 'booking_cancelled' } as Record<string, string>)[status] ?? null;
}
export function dhakaTime(iso: string) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso));
}
/** Reminder window: calls starting 23 to 25 hours from now. */
export function reminderWindow(now: number) {
  return { from: new Date(now + 23 * 3600000).toISOString(), to: new Date(now + 25 * 3600000).toISOString() };
}
export function fillTemplate(text: string, values: Record<string, string>) {
  return text.replace(/{{\s*([a-z_]+)\s*}}/g, (_, key: string) => values[key] ?? '');
}
export function bookingIcs(b: { id: string; slot_at: string; duration_minutes: number; meet_link: string | null }) {
  const safe = (s: string) => s.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const stamp = (n: number) => new Date(n).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const start = Date.parse(b.slot_at);
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Admakai//Bookings//EN', 'BEGIN:VEVENT', `UID:booking-${b.id}@admakai.com`, `DTSTAMP:${stamp(Date.now())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(start + b.duration_minutes * 60000)}`, 'SUMMARY:Admakai call', `LOCATION:${safe(b.meet_link ?? '')}`, `DESCRIPTION:${safe(b.meet_link ? `Join: ${b.meet_link}` : 'Admakai call')}`, 'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n');
}
