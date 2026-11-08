import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { bookingStatusTrigger } from './crm-email-rules';

/** Public: called right after a booking request; the server only sends for a fresh, un-emailed request. */
export const notifyBookingRequested = createServerFn({ method: 'POST' }).inputValidator(z.object({ id: z.string().uuid() })).handler(async ({ data }) => {
  const { deliverBookingRequested } = await import('./crm-emails.server');
  try { return await deliverBookingRequested(data.id); } catch { return { sent: 0 }; }
});

/** Staff: sends the client email that matches the booking's current status. */
export const notifyBookingStatus = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid(), status: z.string().max(30) })).handler(async ({ data, context }) => {
  const role = await context.supabase.from('user_roles').select('role').eq('user_id', context.userId).maybeSingle();
  if (!role.data || !['owner', 'manager', 'member'].includes(role.data.role)) throw new Error('Staff access required');
  const trigger = bookingStatusTrigger(data.status);
  if (!trigger) return { results: [] };
  const b = await context.supabase.from('bookings').select('status').eq('id', data.id).single();
  if (b.error || b.data.status !== data.status) throw new Error('Booking status does not match');
  const { deliverBookingStatus } = await import('./crm-emails.server');
  return { results: await deliverBookingStatus(data.id, trigger) };
});
