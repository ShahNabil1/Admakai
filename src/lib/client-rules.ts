export const maxUploadBytes = 10 * 1024 * 1024;
export const maxBookingFiles = 5;
export type ClientBooking = { id: string; client_id: string; slot_at: string; duration_minutes: number; status: string; owner_id: string | null; meet_link: string | null; notes_shared: string | null };
export function nextCall(bookings: ClientBooking[], now: number) {
  return bookings.filter(b => ['requested','in_review','confirmed','rescheduled'].includes(b.status) && Date.parse(b.slot_at) > now).sort((a,b) => Date.parse(a.slot_at)-Date.parse(b.slot_at))[0];
}
export function canJoin(booking: ClientBooking, now: number) {
  const start = Date.parse(booking.slot_at);
  return booking.status === 'confirmed' && !!safeMeetLink(booking.meet_link) && now >= start - 10 * 60000 && now <= start + (booking.duration_minutes + 30) * 60000;
}
export function safeMeetLink(value: string | null) { try { const url = new URL(value ?? ''); return url.protocol === 'https:' ? url.href : null; } catch { return null; } }
export function firstName(name: string | null | undefined) { return name?.trim().split(/\s+/)[0] || ''; }
export function realFileMime(bytes: Uint8Array): string | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start,end));
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if ([137,80,78,71,13,10,26,10].every((n,i) => bytes[i] === n)) return 'image/png';
  if (ascii(0,4) === 'RIFF' && ascii(8,12) === 'WEBP') return 'image/webp';
  if (ascii(0,5) === '%PDF-') return 'application/pdf';
  if (ascii(4,8) === 'ftyp' && ['heic','heix','hevc','hevx','mif1','msf1'].some(brand => ascii(8,48).includes(brand))) return 'image/heic';
  return null;
}