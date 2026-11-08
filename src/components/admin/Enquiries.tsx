import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Empty, fmtDate, label } from './ui';

type Enquiry = { id: string; lead_id: string | null; service_interest: string | null; budget_band: string | null; message: string | null; attachment_path: string | null; source_page: string | null; created_at: string; clients?: { contact_name: string | null; email: string | null; brand_name: string | null } | null };
// The enquiries table is newer than the generated types, so it is read through an untyped handle.
const enquiries = () => (supabase as unknown as { from: (t: string) => any }).from('enquiries'); // eslint-disable-line @typescript-eslint/no-explicit-any

function Attachment({ path }: { path: string }) {
  const [busy, setBusy] = useState(false);
  return <button className="admin-btn-ghost" disabled={busy} onClick={async () => {
    setBusy(true);
    const { data } = await supabase.storage.from('enquiry-uploads').createSignedUrl(path, 600);
    setBusy(false);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }}>Open attachment</button>;
}

export function LeadEnquiries({ leadId }: { leadId: string }) {
  const [rows, setRows] = useState<Enquiry[] | null>(null);
  useEffect(() => { void enquiries().select('*').eq('lead_id', leadId).order('created_at', { ascending: false }).then(({ data }: { data: Enquiry[] | null }) => setRows(data ?? [])); }, [leadId]);
  if (!rows?.length) return null;
  return <>
    <h3 className="admin-sub">Enquiries</h3>
    {rows.map((q) => <dl key={q.id} className="admin-facts">
      <div><dt>Received</dt><dd>{fmtDate(q.created_at)}</dd></div>
      <div><dt>Service</dt><dd>{q.service_interest ? label(q.service_interest) : 'Not supplied'}</dd></div>
      <div><dt>Budget</dt><dd>{q.budget_band ? label(q.budget_band) : 'Not supplied'}</dd></div>
      <div><dt>Source page</dt><dd>{q.source_page ?? 'Not supplied'}</dd></div>
      <div><dt>Message</dt><dd className="booking-submission-message">{q.message ?? 'Not supplied'}</dd></div>
      <div><dt>Attachment</dt><dd>{q.attachment_path ? <Attachment path={q.attachment_path} /> : 'None'}</dd></div>
    </dl>)}
  </>;
}

export function NewEnquiries({ onOpen }: { onOpen: (leadId: string) => void }) {
  const [rows, setRows] = useState<Enquiry[] | null>(null);
  useEffect(() => { void enquiries().select('*, clients(contact_name, email, brand_name)').gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()).order('created_at', { ascending: false }).limit(20).then(({ data }: { data: Enquiry[] | null }) => setRows(data ?? [])); }, []);
  return <>
    <h2 className="admin-sub">New enquiries</h2>
    {rows === null ? <div className="admin-skeleton" /> : rows.length ? <div className="admin-grid">{rows.map((q) => <button key={q.id} className="admin-card-item is-lead" disabled={!q.lead_id} onClick={() => q.lead_id && onOpen(q.lead_id)}>
      <div className="admin-card-top"><strong className="truncate">{q.clients?.contact_name || q.clients?.brand_name || 'Unnamed'}</strong><small>{q.source_page}</small></div>
      <p className="truncate">{q.service_interest ? label(q.service_interest) : 'General enquiry'}{q.budget_band ? ` · ${label(q.budget_band)}` : ''}</p>
      <div className="admin-card-meta"><span>{fmtDate(q.created_at)}</span><span className="truncate">{q.clients?.email}</span></div>
    </button>)}</div> : <Empty title="No new enquiries this week" />}
  </>;
}
