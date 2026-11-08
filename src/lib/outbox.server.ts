import { supabaseAdmin as db } from '@/integrations/supabase/client.server';
import { canAutoRetry, retryDelayMinutes } from './outbox-rules';

/** One rendered email to one recipient. `skip` records why it must not be sent; `sent` holds the provider id once delivered. */
export type OutboxMessage = { to: string; from: string; reply_to?: string | null; subject: string; html: string; text: string; skip?: string | null; sent?: string | null };
/** Inline base64 content, a stored file, or the file produced by another outbox row. */
export type OutboxAttachment = { filename: string; content?: string; bucket?: string; path?: string; from_outbox?: string };
export type EmailPayload = { messages: OutboxMessage[]; attachments: OutboxAttachment[]; wait_for?: string[] };
type Kind = 'email' | 'agreement_pdf' | 'offer_letter' | 'promotion_letter';
type Row = { id: string; kind: Kind; trigger_key: string; application_id: string | null; journey_id: string | null; booking_id: string | null; event_id: string; payload: unknown; status: string; attempts: number; result: unknown };
// The generated types predate this table; keep the untyped boundary in one place.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const outbox = (): any => (db as unknown as { from: (t: string) => unknown }).from('delivery_outbox');

/** Stable uuid derived from the parts, so the same real-world event always maps to the same outbox key. */
export async function eventKey(...parts: Array<string | number | null | undefined>) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(parts.map((p) => String(p ?? '')).join('|'))));
  const h = [...digest.slice(0, 16)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/** Stores the snapshot first. A duplicate (same event, kind and trigger) returns the existing row instead of a second send. */
export async function enqueue(row: { kind: Kind; trigger_key?: string; event_id: string; application_id?: string | null; journey_id?: string | null; booking_id?: string | null; payload: unknown }) {
  const record = { trigger_key: '', application_id: null, journey_id: null, booking_id: null, ...row };
  const ins = await outbox().upsert(record as never, { onConflict: 'event_id,kind,trigger_key', ignoreDuplicates: true }).select('id');
  if (ins.error) throw new Error(`Could not queue delivery: ${ins.error.message}`);
  const created = (ins.data as unknown as Array<{ id: string }> | null)?.[0]?.id;
  if (created) return created;
  const found = await outbox().select('id').eq('event_id' as never, record.event_id).eq('kind' as never, record.kind).eq('trigger_key', record.trigger_key).single();
  if (found.error || !found.data) throw new Error('Could not queue delivery');
  return (found.data as unknown as { id: string }).id;
}

function toBase64(bytes: Uint8Array) { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); }

async function resolveAttachments(list: OutboxAttachment[]) {
  const out: Array<{ filename: string; content: string }> = [];
  for (const a of list) {
    if (a.content) { out.push({ filename: a.filename, content: a.content }); continue; }
    let bucket = a.bucket, path = a.path;
    if (a.from_outbox) {
      const r = await outbox().select('result').eq('id', a.from_outbox).single();
      const result = (r.data as unknown as { result: { bucket?: string; path?: string } | null } | null)?.result;
      bucket = result?.bucket; path = result?.path;
    }
    if (!bucket || !path) throw new Error(`Attachment ${a.filename} is not ready`);
    const file = await db.storage.from(bucket).download(path);
    if (file.error || !file.data) throw new Error(`Attachment ${a.filename} could not be read`);
    out.push({ filename: a.filename, content: toBase64(new Uint8Array(await file.data.arrayBuffer())) });
  }
  return out;
}

/** 'wait' when a file this email needs is still being produced. */
async function sendEmailRow(row: Row): Promise<'done' | 'wait'> {
  const payload = row.payload as EmailPayload;
  if (payload.wait_for?.length) {
    const deps = await outbox().select('id,status,attempts').in('id', payload.wait_for);
    const list = (deps.data as unknown as Array<{ status: string; attempts: number }> | null) ?? [];
    if (list.some((d) => d.status === 'failed' && !canAutoRetry(d.attempts))) throw new Error('A document this email needs could not be created');
    if (list.length < payload.wait_for.length || list.some((d) => d.status !== 'sent')) return 'wait';
  }
  const key = process.env['RESEND_API_KEY'];
  const pending = payload.messages.filter((m) => !m.sent);
  if (pending.some((m) => !m.skip) && !key) throw new Error('Email service is not configured');
  const attachments = pending.some((m) => !m.skip) ? await resolveAttachments(payload.attachments ?? []) : [];
  const errors: string[] = [];
  for (const m of pending) {
    let status = 'skipped', providerId: string | null = null, error: string | null = m.skip ?? null;
    if (!m.skip) {
      try {
        const r = await fetch('https://api.resend.com/emails', { method: 'POST', signal: AbortSignal.timeout(15000), headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: m.from, to: [m.to], ...(m.reply_to ? { reply_to: m.reply_to } : {}), subject: m.subject, html: m.html, text: m.text, ...(attachments.length ? { attachments } : {}) }) });
        if (!r.ok) { const body = await r.json().catch(() => ({})); throw new Error(`Resend ${r.status}: ${typeof body.message === 'string' ? body.message.slice(0, 300) : 'Delivery rejected'}`); }
        providerId = (await r.json()).id ?? null; status = 'sent'; error = null;
      } catch (e) { status = 'failed'; error = e instanceof Error ? e.message : 'Email delivery failed'; errors.push(`${m.to}: ${error}`); }
    }
    if (status !== 'failed') m.sent = providerId ?? status;
    const log = await db.from('email_log').insert({ application_id: row.application_id, booking_id: row.booking_id, to_email: m.to, trigger_key: row.trigger_key, status, provider_id: providerId, error, outbox_id: row.id } as never);
    // The send already happened; a logging problem must not trigger a duplicate send, so it is reported, not thrown.
    if (log.error) console.error(`Email log write failed for outbox ${row.id}: ${log.error.message}`);
  }
  // Persist per-recipient progress so a retry only resends to recipients that failed.
  await outbox().update({ payload } as never).eq('id', row.id);
  if (errors.length) throw new Error(errors.join('; ').slice(0, 1000));
  return 'done';
}

async function runRow(row: Row) {
  try {
    let result: unknown = null;
    if (row.kind === 'email') {
      if (await sendEmailRow(row) === 'wait') {
        await outbox().update({ status: 'pending', attempts: Math.max(0, row.attempts - 1), next_attempt_at: new Date(Date.now() + 60000).toISOString() } as never).eq('id', row.id);
        return 'pending';
      }
    } else if (row.kind === 'agreement_pdf') {
      const { generateAgreementPdf } = await import('./hiring-delivery.server');
      const p = row.payload as import('./hiring-delivery.server').AgreementEditionPayload;
      if(!p.snapshot){const {snapshotAgreement}=await import('./hiring-delivery.server');p.snapshot=await snapshotAgreement(p.application_id);await outbox().update({payload:p}).eq('id',row.id);}
      try { result = { bucket: 'agreements', path: await generateAgreementPdf(p.application_id,p,row.event_id) }; }
      finally { await outbox().update({payload:p}).eq('id',row.id); }
    } else {
      const { buildLetter } = await import('./hiring-letters.server');
      result = await buildLetter(row.payload as never, row.id);
    }
    await outbox().update({ status: 'sent', sent_at: new Date().toISOString(), last_error: null, result } as never).eq('id', row.id);
    return 'sent';
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Delivery failed';
    await outbox().update({ status: 'failed', last_error: message.slice(0, 2000), next_attempt_at: new Date(Date.now() + retryDelayMinutes(row.attempts) * 60000).toISOString() } as never).eq('id', row.id);
    console.error(`Outbox ${row.kind} ${row.trigger_key} failed: ${message}`);
    return 'failed';
  }
}

/** Claims due rows (or the given ones), works through them oldest first, and reports each final status. */
export async function processOutbox(ids?: string[], limit = 20) {
  const claimed = await db.rpc('claim_delivery_outbox' as never, { _ids: ids?.length ? ids : null, _limit: limit } as never);
  if (claimed.error) throw new Error(`Could not process deliveries: ${claimed.error.message}`);
  const rows = ((claimed.data as unknown as Row[]) ?? []).sort((a, b) => (a.kind === 'email' ? 1 : 0) - (b.kind === 'email' ? 1 : 0));
  const out: Record<string, string> = {};
  // Files first so dependent emails find them in the same run.
  for (const row of rows) out[row.id] = await runRow(row);
  for (const row of rows) if (out[row.id] === 'pending' && row.kind === 'email') {
    const again = await db.rpc('claim_delivery_outbox' as never, { _ids: [row.id], _limit: 1 } as never);
    const r = (again.data as unknown as Row[] | null)?.[0];
    if (r) out[row.id] = await runRow(r);
  }
  if (ids?.length) {
    const current = await outbox().select('id,status').in('id', ids);
    for (const r of (current.data as unknown as Array<{ id: string; status: string }> | null) ?? []) out[r.id] = r.status;
  }
  const values = Object.values(out);
  return { statuses: out, processed: rows.length, sent: values.filter((s) => s === 'sent').length, failed: values.filter((s) => s === 'failed').length, pending: values.filter((s) => s === 'pending' || s === 'sending').length };
}

/** Manual retry from the stored snapshot; it never re-reads the current record. */
export async function retryOutbox(id: string) {
  const r = await outbox().select('id,status,attempts').eq('id', id).single();
  const row = r.data as unknown as { status: string; attempts: number } | null;
  if (r.error || !row) throw new Error('Delivery not found');
  if (row.status === 'sent') return { status: 'sent' };
  const upd = await outbox().update({ status: 'pending', attempts: Math.min(row.attempts, 4), next_attempt_at: new Date().toISOString() } as never).eq('id', id).select('id');
  if (upd.error || !(upd.data as unknown[] | null)?.length) throw new Error('Delivery could not be reset');
  const done = await processOutbox([id]);
  return { status: done.statuses[id] ?? 'pending' };
}

export async function failedDeliveryCount() {
  const r = await outbox().select('id', { count: 'exact', head: true }).eq('status' as never, 'failed');
  return r.count ?? 0;
}
