import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ appRpc: vi.fn(), publicRpc: vi.fn(), otp: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabase: { schema: () => ({ rpc: mocks.appRpc }), rpc: mocks.publicRpc, auth: { signInWithOtp: mocks.otp } } }));
import { fetchOpenSlots, createPublicBooking, sendBookingLink } from './booking-api';
beforeEach(() => vi.resetAllMocks());
it('falls back only for an unavailable app schema', async () => {
  mocks.appRpc.mockResolvedValue({ error: { code: 'PGRST106', message: 'Invalid schema' } });
  mocks.publicRpc.mockResolvedValue({ data: [], error: null });
  expect(await fetchOpenSlots()).toEqual([]);
  expect(mocks.publicRpc).toHaveBeenCalledWith('open_slots', {});
});
it('does not retry a booking business error in another schema', async () => {
  mocks.appRpc.mockResolvedValue({ error: { code: 'P0001', message: 'slot_unavailable' } });
  await expect(createPublicBooking('2026-10-31T10:00:00Z', { name: 'Nadia', email: 'nadia@example.invalid', whatsapp: '+8801712345678', brand: '', need: 'tvc', message: '', budget: 'not_decided' }, {})).rejects.toThrow('slot_unavailable');
  expect(mocks.publicRpc).not.toHaveBeenCalled();
});
it('requests account creation and same-origin app email redirect', async () => {
  mocks.otp.mockResolvedValue({ error: null });
  await sendBookingLink('nadia@example.invalid');
  expect(mocks.otp).toHaveBeenCalledWith({ email: 'nadia@example.invalid', options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/dashboard/calls` } });
});
it('reports OTP failure rather than pretending email delivery', async () => {
  mocks.otp.mockResolvedValue({ error: { message: 'Email rate limit exceeded' } });
  await expect(sendBookingLink('nadia@example.invalid')).rejects.toThrow('Email rate limit exceeded');
});
it('saves the exact service interest at the start of the existing message', async () => {
  mocks.appRpc.mockResolvedValue({data:'12345678-1234-4234-8234-123456789abc',error:null});
  await createPublicBooking('2026-11-07T10:00:00Z', {name:'Nadia',email:'nadia@example.invalid',whatsapp:'+8801712345678',brand:'',need:'tvc',message:'We need an ad.',budget:'not_decided'}, {}, 'AI UGC Ads');
  expect(mocks.appRpc).toHaveBeenCalledWith('create_booking',expect.objectContaining({p_need:'tvc',p_message:'Interested in: AI UGC Ads\nWe need an ad.'}));
});
it('saves the exact plan interest without adding a database field', async () => {
  mocks.appRpc.mockResolvedValue({data:'12345678-1234-4234-8234-123456789abc',error:null});
  await createPublicBooking('2026-11-07T10:00:00Z', {name:'Nadia',email:'nadia@example.invalid',whatsapp:'+8801712345678',brand:'',need:'unsure',message:'',budget:'not_decided'}, {}, 'Growth');
  expect(mocks.appRpc).toHaveBeenCalledWith('create_booking',expect.objectContaining({p_need:'unsure',p_message:'Interested in: Growth'}));
});