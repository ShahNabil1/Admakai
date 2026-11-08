import { supabaseAdmin as db } from '@/integrations/supabase/client.server';
import { hiringEmailHtml } from './hiring-email-design';
import { bookingIcs, dhakaTime, fillTemplate, reminderWindow } from './crm-email-rules';

type Attachment = { filename: string; content: string };
async function settings() {
  const { data, error } = await db.from('hiring_settings').select('from_email,reply_to,company_address,notify_admin_emails').single();
  if (error || !data) throw new Error('Email settings unavailable');
  return data;
}
/** Sends one template to each recipient through Resend and logs every attempt. */
export async function sendCrmEmail(trigger: string, to: string[], values: Record<string, string>, opts: { bookingId?: string | null; button: string; buttonLabel: string; attachments?: Attachment[] }) {
  const s = await settings();
  const { data: t, error } = await db.from('email_templates').select('*').eq('trigger_key', trigger).single();
  if (error || !t) throw new Error(`Template ${trigger} missing`);
  const results: { to: string; status: string }[] = [];
  for (const email of to.filter(Boolean)) {
    let status = 'skipped', err: string | null = null, providerId: string | null = null;
    if (t.is_enabled && process.env['RESEND_API_KEY']) {
      try {
        const subject = fillTemplate(t.subject, values), content = fillTemplate(t.body, values);
        const r = await fetch('https://api.resend.com/emails', { method: 'POST', signal: AbortSignal.timeout(15000), headers: { Authorization: `Bearer ${process.env['RESEND_API_KEY']}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: s.from_email, to: [email], ...(s.reply_to ? { reply_to: s.reply_to } : {}), subject, html: hiringEmailHtml(subject, content, opts.button, s.company_address ?? '', false, opts.buttonLabel), text: `${content}\n\n${opts.button}\n\nAdmakai`, ...(opts.attachments?.length ? { attachments: opts.attachments } : {}) }) });
        if (!r.ok) { const body = await r.json().catch(() => ({})); throw new Error(`Resend ${r.status}: ${typeof body.message === 'string' ? body.message.slice(0, 300) : 'Delivery rejected'}`); }
        providerId = (await r.json()).id ?? null; status = 'sent';
      } catch (e) { status = 'failed'; err = e instanceof Error ? e.message : 'Email delivery failed'; }
    }
    const log = await db.from('email_log').insert({ to_email: email, trigger_key: trigger, status, provider_id: providerId, error: err, booking_id: opts.bookingId ?? null } as never);
    if (log.error) throw log.error;
    results.push({ to: email, status });
  }
  return results;
}

async function bookingContext(id: string) {
  const { data, error } = await db.from('bookings').select('id,slot_at,duration_minutes,status,meet_link,notes_shared,created_at,reminder_24_sent_at,brief,clients(contact_name,email,brand_name)').eq('id', id).single();
  if (error || !data) throw new Error('Booking unavailable');
  const c = (data as unknown as { clients: { contact_name: string | null; email: string | null; brand_name: string | null } | null }).clients;
  const brief = (data.brief ?? {}) as Record<string, unknown>;
  const values = { client_name: c?.contact_name || 'there', client_email: c?.email ?? '', brand: c?.brand_name ?? '', booking_time: dhakaTime(data.slot_at), duration: String(data.duration_minutes), meet_link: data.meet_link || 'We will send the link before the call.', reason: data.notes_shared ?? '', message: typeof brief['message'] === 'string' ? brief['message'] : '' };
  return { booking: data, email: c?.email ?? '', values };
}
async function alreadyLogged(bookingId: string, trigger: string) {
  const { count } = await db.from('email_log').select('id', { count: 'exact', head: true }).eq('booking_id' as never, bookingId).eq('trigger_key', trigger);
  return (count ?? 0) > 0;
}
/** Client "request received" and admin "new booking" emails, once per booking. */
export async function deliverBookingRequested(id: string) {
  const { booking, email, values } = await bookingContext(id);
  if (booking.status !== 'requested' || Date.now() - Date.parse(booking.created_at) > 15 * 60000) return { sent: 0 };
  if (await alreadyLogged(id, 'booking_requested')) return { sent: 0 };
  const s = await settings();
  const a = await sendCrmEmail('booking_requested', [email], values, { bookingId: id, button: 'https://admakai.com/app', buttonLabel: 'View your booking' });
  const b = await sendCrmEmail('booking_new_admin', s.notify_admin_emails ?? [], values, { bookingId: id, button: `https://admakai.com/admin?tab=bookings&booking=${id}`, buttonLabel: 'Open booking' });
  return { sent: [...a, ...b].filter(r => r.status === 'sent').length };
}
export async function deliverBookingStatus(id: string, trigger: string) {
  const { booking, email, values } = await bookingContext(id);
  const attachments = trigger === 'booking_confirmed' ? [{ filename: 'admakai-call.ics', content: btoa(bookingIcs(booking)) }] : [];
  if (trigger === 'booking_cancelled' && values.reason) values.reason = `Reason: ${values.reason}`;
  return sendCrmEmail(trigger, [email], values, { bookingId: id, button: trigger === 'booking_cancelled' ? 'https://admakai.com/book' : 'https://admakai.com/app', buttonLabel: trigger === 'booking_cancelled' ? 'Book a new time' : 'View your booking', attachments });
}
export async function sendBookingReminders() {
  const w = reminderWindow(Date.now());
  const { data, error } = await db.from('bookings').select('id').eq('status', 'confirmed').is('reminder_24_sent_at', null).gte('slot_at', w.from).lte('slot_at', w.to);
  if (error) throw error;
  let sent = 0, failed = 0;
  for (const b of data ?? []) {
    const claim = await db.from('bookings').update({ reminder_24_sent_at: new Date().toISOString() }).eq('id', b.id).is('reminder_24_sent_at', null).select('id');
    if (claim.error) throw claim.error; if (!claim.data?.length) continue;
    try { const r = await deliverBookingStatus(b.id, 'booking_reminder'); if (r.some(x => x.status === 'sent')) sent++; else { failed++; await db.from('bookings').update({ reminder_24_sent_at: null }).eq('id', b.id); } }
    catch { failed++; await db.from('bookings').update({ reminder_24_sent_at: null }).eq('id', b.id); }
  }
  return { sent, failed };
}
/** Interview and booking reminders share the cron endpoint and the admin button. */
export async function sendAllReminders() {
  const { sendInterviewReminders } = await import('./hiring-interviews.server');
  const [i, b] = await Promise.all([sendInterviewReminders(), sendBookingReminders()]);
  return { sent: i.sent + b.sent, failed: i.failed + b.failed, interviews: i, bookings: b };
}
export async function deliverEnquiry(id: string) {
  const { data, error } = await db.from('enquiries' as never).select('id,service_interest,budget_band,message,source_page,lead_id,clients(contact_name,email,whatsapp,brand_name)').eq('id', id).single();
  if (error || !data) throw new Error('Enquiry unavailable');
  const q = data as unknown as { id: string; service_interest: string | null; budget_band: string | null; message: string | null; source_page: string | null; clients: { contact_name: string | null; email: string | null; whatsapp: string | null; brand_name: string | null } | null };
  const values = { client_name: q.clients?.contact_name || 'there', client_email: q.clients?.email ?? '', whatsapp: q.clients?.whatsapp ?? '', brand: q.clients?.brand_name ?? '', service: q.service_interest ?? 'Not specified', budget: q.budget_band ?? 'Not specified', message: q.message ?? '', source_page: q.source_page ?? 'the website' };
  const s = await settings();
  const a = await sendCrmEmail('enquiry_received', [values.client_email], values, { button: 'https://admakai.com/services', buttonLabel: 'Explore our services' });
  const b = await sendCrmEmail('enquiry_new_admin', s.notify_admin_emails ?? [], values, { button: 'https://admakai.com/admin?tab=leads', buttonLabel: 'Open pipeline' });
  return [...a, ...b];
}
