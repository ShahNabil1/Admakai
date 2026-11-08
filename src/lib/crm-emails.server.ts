import { supabaseAdmin as db } from '@/integrations/supabase/client.server';
import { hiringEmailHtml } from './hiring-email-design';
import { bookingIcs, dhakaTime, fillTemplate, reminderWindow } from './crm-email-rules';
import { enqueue, eventKey, processOutbox } from './outbox.server';

type Attachment = { filename: string; content: string };
async function settings() {
  const { data, error } = await db.from('hiring_settings').select('from_email,reply_to,company_address,notify_admin_emails').single();
  if (error || !data) throw new Error('Email settings unavailable');
  return data;
}
/** Renders one template per recipient, stores the snapshot in the outbox, then tries to send it straight away. */
export async function sendCrmEmail(trigger: string, to: string[], values: Record<string, string>, opts: { eventId: string; bookingId?: string | null; button: string; buttonLabel: string; attachments?: Attachment[]; process?: boolean }) {
  const s = await settings();
  const { data: t, error } = await db.from('email_templates').select('*').eq('trigger_key', trigger).single();
  if (error || !t) throw new Error(`Template ${trigger} missing`);
  const subject = fillTemplate(t.subject, values), content = fillTemplate(t.body, values);
  const messages = to.filter(Boolean).map((email) => ({ to: email, from: s.from_email, reply_to: s.reply_to, subject, html: hiringEmailHtml(subject, content, opts.button, s.company_address ?? '', false, opts.buttonLabel), text: `${content}\n\n${opts.button}\n\nAdmakai`, skip: t.is_enabled ? null : 'Template disabled' }));
  if (!messages.length) return [];
  const id = await enqueue({ kind: 'email', trigger_key: trigger, event_id: opts.eventId, booking_id: opts.bookingId ?? null, payload: { messages, attachments: opts.attachments ?? [] } });
  const status = opts.process === false ? 'pending' : (await processOutbox([id])).statuses[id] ?? 'pending';
  return messages.map((m) => ({ to: m.to, status, outboxId: id }));
}

async function bookingContext(id: string) {
  const { data, error } = await db.from('bookings').select('id,slot_at,duration_minutes,status,meet_link,notes_shared,created_at,reminder_24_sent_at,brief,clients(contact_name,email,brand_name)').eq('id', id).single();
  if (error || !data) throw new Error('Booking unavailable');
  const c = (data as unknown as { clients: { contact_name: string | null; email: string | null; brand_name: string | null } | null }).clients;
  const brief = (data.brief ?? {}) as Record<string, unknown>;
  const values = { client_name: c?.contact_name || 'there', client_email: c?.email ?? '', brand: c?.brand_name ?? '', booking_time: dhakaTime(data.slot_at), duration: String(data.duration_minutes), meet_link: data.meet_link || 'We will send the link before the call.', reason: data.notes_shared ?? '', message: typeof brief['message'] === 'string' ? brief['message'] : '' };
  return { booking: data, email: c?.email ?? '', values };
}
/** Client "request received" and admin "new booking" emails, once per booking. */
export async function deliverBookingRequested(id: string) {
  const { booking, email, values } = await bookingContext(id);
  if (booking.status !== 'requested' || Date.now() - Date.parse(booking.created_at) > 15 * 60000) return { sent: 0 };
  const s = await settings();
  const a = await sendCrmEmail('booking_requested', [email], values, { eventId: id, bookingId: id, button: 'https://admakai.com/dashboard/calls', buttonLabel: 'View your booking' });
  const b = await sendCrmEmail('booking_new_admin', s.notify_admin_emails ?? [], values, { eventId: id, bookingId: id, button: `https://admakai.com/admin?tab=bookings&booking=${id}`, buttonLabel: 'Open booking' });
  return { sent: [...a, ...b].filter(r => r.status === 'sent').length };
}
export async function deliverBookingStatus(id: string, trigger: string) {
  const { booking, email, values } = await bookingContext(id);
  const attachments = trigger === 'booking_confirmed' ? [{ filename: 'admakai-call.ics', content: btoa(bookingIcs(booking)) }] : [];
  if (trigger === 'booking_cancelled' && values.reason) values.reason = `Reason: ${values.reason}`;
  const eventId = trigger === 'booking_reminder' ? id : await eventKey('booking', id, trigger, booking.slot_at, booking.status, booking.meet_link, booking.notes_shared);
  return sendCrmEmail(trigger, [email], values, { eventId, bookingId: id, button: trigger === 'booking_cancelled' ? 'https://admakai.com/book' : 'https://admakai.com/dashboard/calls', buttonLabel: trigger === 'booking_cancelled' ? 'Book a new time' : 'View your booking', attachments });
}
export async function sendBookingReminders() {
  const w = reminderWindow(Date.now());
  const { data, error } = await db.from('bookings').select('id').eq('status', 'confirmed').is('reminder_24_sent_at', null).gte('slot_at', w.from).lte('slot_at', w.to);
  if (error) throw error;
  let sent = 0, failed = 0;
  for (const b of data ?? []) {
    const claim = await db.from('bookings').update({ reminder_24_sent_at: new Date().toISOString() }).eq('id', b.id).is('reminder_24_sent_at', null).select('id');
    if (claim.error) throw claim.error; if (!claim.data?.length) continue;
    // Queued reminders are retried by the outbox; only a failure to queue releases the claim.
    try { const r = await deliverBookingStatus(b.id, 'booking_reminder'); if (r.some(x => x.status === 'sent')) sent++; else if (r.some(x => x.status === 'failed')) failed++; }
    catch { failed++; await db.from('bookings').update({ reminder_24_sent_at: null }).eq('id', b.id); }
  }
  return { sent, failed };
}
/** One run of the cron endpoint and the admin button: queue due reminders, then work through every due outbox row. */
export async function sendAllReminders() {
  const { sendInterviewReminders } = await import('./hiring-interviews.server');
  const [i, b] = await Promise.all([sendInterviewReminders(), sendBookingReminders()]);
  const outbox = await processOutbox(undefined, 50);
  return { sent: i.sent + b.sent, failed: i.failed + b.failed, interviews: i, bookings: b, outbox: { processed: outbox.processed, sent: outbox.sent, failed: outbox.failed, pending: outbox.pending } };
}
export async function deliverEnquiry(id: string) {
  const { data, error } = await db.from('enquiries' as never).select('id,service_interest,budget_band,message,source_page,lead_id,clients(contact_name,email,whatsapp,brand_name)').eq('id', id).single();
  if (error || !data) throw new Error('Enquiry unavailable');
  const q = data as unknown as { id: string; service_interest: string | null; budget_band: string | null; message: string | null; source_page: string | null; clients: { contact_name: string | null; email: string | null; whatsapp: string | null; brand_name: string | null } | null };
  const values = { client_name: q.clients?.contact_name || 'there', client_email: q.clients?.email ?? '', whatsapp: q.clients?.whatsapp ?? '', brand: q.clients?.brand_name ?? '', service: q.service_interest ?? 'Not specified', budget: q.budget_band ?? 'Not specified', message: q.message ?? '', source_page: q.source_page ?? 'the website' };
  const s = await settings();
  const a = await sendCrmEmail('enquiry_received', [values.client_email], values, { eventId: id, button: 'https://admakai.com/services', buttonLabel: 'Explore our services' });
  const b = await sendCrmEmail('enquiry_new_admin', s.notify_admin_emails ?? [], values, { eventId: id, button: 'https://admakai.com/admin?tab=leads', buttonLabel: 'Open pipeline' });
  return [...a, ...b];
}
