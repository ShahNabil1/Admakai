import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { bookingFormSchema, slotSchema, type BookingDetails } from './booking-form';

// The app schema owns the logic; the existing public wrappers are used when it is not exposed by PostgREST.
async function bookingRpc(name: string, args: Record<string, unknown> = {}) {
  let response = await supabase.schema('app').rpc(name, args);
  if (response.error && (response.error.code === 'PGRST106' || response.error.message.includes('Invalid schema') || response.error.message.includes('schema must be'))) response = await supabase.rpc(name, args);
  if (response.error) throw new Error(response.error.message);
  return response.data;
}
export async function fetchOpenSlots() { return z.array(slotSchema).parse(await bookingRpc('open_slots')); }
export async function createPublicBooking(slotAt: string, details: BookingDetails, source: Record<string, string>) {
  bookingFormSchema.parse(details);
  const id = await bookingRpc('create_booking', { p_slot_at: slotAt, p_name: details.name, p_email: details.email, p_whatsapp: details.whatsapp, p_brand: details.brand, p_need: details.need, p_message: details.message, p_budget_band: details.budget, p_source: source });
  return z.string().uuid().parse(id);
}
export async function sendBookingLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/app` } });
  if (error) throw new Error(error.message);
}