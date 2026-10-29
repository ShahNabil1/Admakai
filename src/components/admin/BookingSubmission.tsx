import { useEffect, useState, type ReactNode } from 'react';
import { CalendarDays, Clock3, FileText, Mail, MessageCircle, Paperclip, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { additionalBookingFields, bookingBudgetLabel, bookingServiceLabels, submissionText } from '@/lib/booking-submission';
import { fmtDate, label } from './ui';

export type BookingSubmissionData = {
  id: string; slot_at: string; duration_minutes: number; created_at: string;
  budget_band: string | null; brief: Record<string, unknown> | null; source: Record<string, unknown> | null;
  clients: { contact_name: string | null; email: string | null; brand_name?: string | null; whatsapp?: string | null } | null;
};
function Fact({ title, value, children }: { title: string; value?: string; children?: ReactNode }) {
  return <div><dt>{title}</dt><dd>{children ?? (value ? value : <span className="booking-not-provided">Not provided</span>)}</dd></div>;
}
type Attachment = { id: string; original_name: string | null; storage_path: string; bytes: number | null; mime: string | null };
function BookingAttachments({ bookingId }: { bookingId: string }) {
  const [files, setFiles] = useState<Attachment[] | null>(null);
  const [error, setError] = useState('');
  const [opening, setOpening] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setFiles(null); setError('');
    const load = async () => {
      const result = await supabase.from('booking_files').select('id, original_name, storage_path, bytes, mime').eq('booking_id', bookingId).order('created_at');
      if (!active) return;
      if (result.error) setError('Attachments could not be loaded. Please reopen this booking to retry.');
      else setFiles(result.data ?? []);
    };
    void load();
    const channel = supabase.channel(`booking-attachments-${bookingId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'booking_files', filter: `booking_id=eq.${bookingId}` }, () => void load()).subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, [bookingId]);
  const openFile = async (file: Attachment) => {
    setOpening(file.id); setError('');
    // Open synchronously so the browser does not block the new tab after the signed-URL request.
    const tab = window.open('about:blank', '_blank');
    if (tab) tab.opener = null;
    const result = await supabase.storage.from('client-uploads').createSignedUrl(file.storage_path, 600);
    setOpening(null);
    if (result.error || !result.data?.signedUrl) { tab?.close(); setError('This attachment could not be opened. Please try again.'); return; }
    if (tab) tab.location.replace(result.data.signedUrl);
    else setError('Allow popups for this site, then try opening the attachment again.');
  };
  return <section className="booking-submission-section" aria-label="Attached files">
    <h3><Paperclip size={16} />Attached files{files && <span>{files.length}</span>}</h3>
    {error && <p className="admin-alert" role="alert">{error}</p>}
    {!files && !error ? <p className="booking-not-provided">Loading attachments…</p> : files?.length ? <ul className="booking-attachments">{files.map(file => <li key={file.id}><FileText size={18} /><div><strong>{file.original_name || 'Attachment'}</strong><small>{file.mime || 'File'}{file.bytes !== null ? ` · ${(file.bytes / 1024 / 1024).toFixed(2)} MB` : ''}</small></div><Button variant="outline" size="sm" disabled={opening !== null} onClick={() => void openFile(file)}>{opening === file.id ? 'Opening…' : 'Open'}</Button></li>)}</ul> : !error && <p className="booking-not-provided">No files attached</p>}
  </section>;
}
export function BookingSubmission({ booking }: { booking: BookingSubmissionData }) {
  const brief = booking.brief ?? {};
  const name = submissionText(brief.name) || booking.clients?.contact_name || '';
  const email = submissionText(brief.email) || booking.clients?.email || '';
  const whatsapp = submissionText(brief.whatsapp) || booking.clients?.whatsapp || '';
  const brand = submissionText(brief.brand ?? brief.brand_name) || booking.clients?.brand_name || '';
  const need = submissionText(brief.need);
  const budget = bookingBudgetLabel(brief.budget_band ?? brief.budget ?? booking.budget_band);
  const message = submissionText(brief.message);
  const extra = additionalBookingFields(brief);
  const source = Object.entries(booking.source ?? {});
  const date = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(booking.slot_at));
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(booking.slot_at));
  return <div className="booking-submission">
    <section className="booking-submission-section" aria-label="Contact details"><h3><UserRound size={16} />Contact details</h3><dl className="booking-submission-facts">
      <Fact title="Your name" value={name} /><Fact title="Brand or page name" value={brand} />
      <Fact title="Email" value={email}>{email ? <a href={`mailto:${email}`}><Mail size={14} />{email}</a> : undefined}</Fact>
      <Fact title="WhatsApp number" value={whatsapp}>{/^\+[1-9]\d{9,14}$/.test(whatsapp) ? <a href={`https://wa.me/${whatsapp.slice(1)}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} />{whatsapp}</a> : undefined}</Fact>
    </dl></section>
    <section className="booking-submission-section" aria-label="Booking request"><h3><CalendarDays size={16} />Booking request</h3><dl className="booking-submission-facts">
      <Fact title="Selected service" value={bookingServiceLabels[need] ?? need} /><Fact title="Budget range" value={budget} />
      <Fact title="Selected date" value={date} /><Fact title="Selected time" value={time} />
      <Fact title="Time zone" value="Asia/Dhaka (GMT+6)" /><Fact title="Call duration" value={`${booking.duration_minutes} minutes`} />
    </dl></section>
    <section className="booking-submission-section" aria-label="Client message"><h3><MessageCircle size={16} />What is the problem</h3><p className={message ? 'booking-submission-message' : 'booking-not-provided'}>{message || 'No message provided'}</p></section>
    {extra.length > 0 && <section className="booking-submission-section"><h3><FileText size={16} />Additional submitted details</h3><dl className="booking-submission-facts">{extra.map(field => <Fact key={field.key} title={label(field.key)} value={field.value} />)}</dl></section>}
    <BookingAttachments bookingId={booking.id} />
    <section className="booking-submission-section"><h3><Clock3 size={16} />Submission record</h3><dl className="booking-submission-facts"><Fact title="Submitted on" value={booking.created_at ? `${fmtDate(booking.created_at)} · Dhaka time` : ''} /><Fact title="Booking ID" value={booking.id} /></dl>
      <details className="booking-source"><summary>Source &amp; campaign details</summary>{source.length ? <dl className="booking-submission-facts">{source.map(([key, value]) => <Fact key={key} title={label(key)} value={submissionText(value)} />)}</dl> : <p className="booking-not-provided">No source information recorded</p>}</details>
    </section>
  </div>;
}