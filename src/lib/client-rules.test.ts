import { describe, expect, it } from 'vitest';
import { canJoin, nextCall, firstName, safeAppPath, realFileMime, maxUploadBytes, maxBookingFiles } from './client-rules';
const start = Date.parse('2026-10-31T10:00:00Z');
const booking = { id:'b',client_id:'c',slot_at:'2026-10-31T10:00:00Z',duration_minutes:30,status:'confirmed',owner_id:null,meet_link:'https://meet.google.com/test',notes_shared:null };
describe('Client area rules', () => {
  it('opens Join exactly ten minutes before a confirmed call', () => { expect(canJoin(booking,start-600001)).toBe(false); expect(canJoin(booking,start-600000)).toBe(true); });
  it('closes Join thirty minutes after the call ends', () => { expect(canJoin(booking,start+3600000)).toBe(true); expect(canJoin(booking,start+3600001)).toBe(false); });
  it('never joins requested calls', () => expect(canJoin({...booking,status:'requested'},start)).toBe(false));
  it('selects the soonest future call from all four active statuses', () => { expect(nextCall([{...booking,id:'later',slot_at:'2026-11-01T10:00:00Z'}, {...booking,id:'rescheduled',status:'rescheduled'}, {...booking,id:'cancelled',status:'cancelled',slot_at:'2026-10-30T10:00:00Z'}],start-1)?.id).toBe('rescheduled'); });
  it('never greets with an email fallback', () => { expect(firstName('')).toBe(''); expect(firstName('  Nadia Ahmed ')).toBe('Nadia'); });
  it('rejects external and protocol-relative redirect destinations', () => { expect(safeAppPath('https://evil.test/app')).toBe('/app'); expect(safeAppPath('//evil.test')).toBe('/app'); expect(safeAppPath('/app/calls')).toBe('/app/calls'); });
  it('limits each booking to five files', () => expect(maxBookingFiles).toBe(5));
  it('limits each file to ten megabytes', () => expect(maxUploadBytes).toBe(10485760));
  it('identifies real signatures and rejects a renamed text file', () => { expect(realFileMime(new Uint8Array([137,80,78,71,13,10,26,10]))).toBe('image/png'); expect(realFileMime(new TextEncoder().encode('not an image.png'))).toBe(null); expect(realFileMime(new TextEncoder().encode('%PDF-1.7'))).toBe('application/pdf'); });
});