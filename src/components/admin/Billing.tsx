import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Printer, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { balanceDue, canRecordPayment, canVoid, formatMoney, invoiceTotal, isEditable, PAYMENT_METHODS, validatePayment, type InvoiceStatus } from '@/lib/billing';
import type { ActivityRow } from '@/lib/activity';
import { fetchActivity } from './ActivityLog';
import { Empty, Modal, Pill, Timeline, fmtDate, label, useConfirm } from './ui';

export type Invoice = { id: string; number: string | null; client_id: string; project_id: string | null; status: InvoiceStatus; currency: string; issued_at: string | null; due_at: string | null; notes: string | null; subtotal: number; paid_total: number; created_at: string; clients: { contact_name: string | null; brand_name: string | null; email: string | null } | null };
type Item = { id: string; invoice_id: string; description: string; quantity: number; unit_price: number };
type Payment = { id: string; invoice_id: string; amount: number; method: string; reference: string | null; paid_at: string };
type ClientOpt = { id: string; contact_name: string | null; brand_name: string | null; email: string | null };

const INVOICE_COLS = 'id, number, client_id, project_id, status, currency, issued_at, due_at, notes, subtotal, paid_total, created_at, clients(contact_name, brand_name, email)';
const errText = (e: { message: string; code?: string }) => (e.code === '42501' ? e.message.includes('cannot') || e.message.includes('Record') ? e.message : 'You do not have permission for that change.' : e.message);
const clientName = (c: { contact_name: string | null; brand_name: string | null } | null) => c?.brand_name || c?.contact_name || 'Client';

export function StaffBilling({ manager, names }: { manager: boolean; names: Record<string, string> }) {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [filter, setFilter] = useState<'all' | InvoiceStatus>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('invoices').select(INVOICE_COLS).order('created_at', { ascending: false }).limit(300);
    if (error) toast.error('Invoices could not be loaded.');
    setInvoices((data ?? []) as unknown as Invoice[]);
  }, []);
  useEffect(() => {
    void load();
    const ch = supabase.channel('admin-billing')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [load]);

  const list = invoices ?? [];
  const sum = (f: (i: Invoice) => boolean, v: (i: Invoice) => number) => list.filter(f).reduce((s, i) => s + Number(v(i)), 0);
  const outstanding = sum((i) => canRecordPayment(i.status), (i) => balanceDue(i.subtotal, i.paid_total));
  const overdue = list.filter((i) => i.status === 'overdue').length;
  const collected = sum(() => true, (i) => i.paid_total);
  const shown = list.filter((i) => filter === 'all' || i.status === filter);
  const open = list.find((i) => i.id === openId) ?? null;

  return (
    <section>
      <header className="admin-head">
        <div><p className="admin-eyebrow">Phase 3</p><h1>Billing</h1></div>
        {manager && <button className="admin-btn" onClick={() => setCreating(true)}><Plus size={16} /> New invoice</button>}
      </header>
      <div className="admin-stats">
        <div className="admin-stat"><span>Outstanding</span><b>{formatMoney(outstanding)}</b></div>
        <div className="admin-stat"><span>Collected</span><b>{formatMoney(collected)}</b></div>
        <div className="admin-stat"><span>Overdue invoices</span><b>{overdue}</b></div>
      </div>
      <div className="admin-chips">
        {(['all', 'draft', 'sent', 'partially_paid', 'paid', 'overdue', 'void'] as const).map((s) => (
          <button key={s} className={filter === s ? 'is-active' : ''} onClick={() => setFilter(s)}>{s === 'all' ? 'All' : label(s)} <small>{s === 'all' ? list.length : list.filter((i) => i.status === s).length}</small></button>
        ))}
      </div>
      {invoices === null ? <div className="admin-skeleton" /> : shown.length === 0 ? <Empty title="No invoices here" hint={manager ? 'Create a draft invoice to start billing a client.' : 'Managers create invoices.'} /> : (
        <div className="admin-grid">
          {shown.map((i) => (
            <button key={i.id} className="admin-card-item" onClick={() => setOpenId(i.id)}>
              <div className="admin-card-top"><strong className="truncate">{i.number ?? 'Draft'}</strong><Pill value={i.status} /></div>
              <p className="truncate">{clientName(i.clients)}</p>
              <div className="admin-card-meta"><span>{formatMoney(Number(i.subtotal), i.currency)}</span><span>{i.due_at ? `Due ${fmtDate(i.due_at, false)}` : 'No due date'}</span></div>
              {Number(i.paid_total) > 0 && <div className="admin-progress"><i style={{ width: `${Math.min(100, (Number(i.paid_total) / Math.max(1, Number(i.subtotal))) * 100)}%` }} /></div>}
            </button>
          ))}
        </div>
      )}
      {creating && <NewInvoice onClose={() => setCreating(false)} onCreated={(id) => { setCreating(false); void load(); setOpenId(id); }} />}
      <Modal open={!!open} onOpenChange={(o) => !o && setOpenId(null)} title={open ? open.number ?? 'Draft invoice' : ''} description={open ? clientName(open.clients) : undefined} wide>
        {open && <InvoiceDetail invoice={open} manager={manager} names={names} reload={load} onDeleted={() => { setOpenId(null); void load(); }} />}
      </Modal>
    </section>
  );
}

function NewInvoice({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [clients, setClients] = useState<ClientOpt[]>([]);
  const [projects, setProjects] = useState<{ id: string; title: string; client_id: string }[]>([]);
  const [form, setForm] = useState({ client_id: '', project_id: '', currency: 'BDT', due_at: '', notes: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void Promise.all([
      supabase.from('clients').select('id, contact_name, brand_name, email').order('created_at', { ascending: false }).limit(500),
      supabase.from('projects').select('id, title, client_id').limit(500),
    ]).then(([c, p]) => { setClients((c.data ?? []) as ClientOpt[]); setProjects(p.data ?? []); });
  }, []);
  const submit = async () => {
    if (!form.client_id) { toast.error('Choose a client.'); return; }
    setBusy(true);
    const { data, error } = await supabase.from('invoices').insert({ client_id: form.client_id, project_id: form.project_id || null, currency: form.currency, due_at: form.due_at || null, notes: form.notes.trim() || null }).select('id').single();
    setBusy(false);
    if (error || !data) { toast.error(error ? errText(error) : 'Could not create invoice.'); return; }
    toast.success('Draft invoice created');
    onCreated(data.id);
  };
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title="New invoice" description="Invoices start as drafts. A number is assigned when you send it.">
      <div className="admin-form">
        <label>Client<select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value, project_id: '' })}>
          <option value="">Choose a client</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{clientName(c)}{c.email ? ` — ${c.email}` : ''}</option>)}
        </select></label>
        <label>Project (optional)<select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
          <option value="">No project</option>
          {projects.filter((p) => p.client_id === form.client_id).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select></label>
        <div className="admin-form-row">
          <label>Currency<select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>{['BDT', 'USD', 'EUR', 'GBP'].map((c) => <option key={c}>{c}</option>)}</select></label>
          <label>Due date<input type="date" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} /></label>
        </div>
        <label>Notes for the client<textarea rows={3} maxLength={2000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
        <div className="admin-dialog-actions"><button className="admin-btn-ghost" onClick={onClose}>Cancel</button><button className="admin-btn" disabled={busy} onClick={submit}>{busy ? 'Creating…' : 'Create draft'}</button></div>
      </div>
    </Modal>
  );
}

export function InvoiceDetail({ invoice, manager, names, reload, onDeleted, client }: { invoice: Invoice; manager: boolean; names: Record<string, string>; reload: () => void; onDeleted?: () => void; client?: boolean }) {
  const [items, setItems] = useState<Item[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [draft, setDraft] = useState({ description: '', quantity: '1', unit_price: '' });
  const [payOpen, setPayOpen] = useState(false);
  const { confirm, node } = useConfirm();
  const editable = manager && isEditable(invoice.status);

  const load = useCallback(async () => {
    const [i, p] = await Promise.all([
      supabase.from('invoice_items').select('id, invoice_id, description, quantity, unit_price').eq('invoice_id', invoice.id).order('created_at'),
      supabase.from('payments').select('id, invoice_id, amount, method, reference, paid_at').eq('invoice_id', invoice.id).order('paid_at'),
    ]);
    setItems((i.data ?? []) as Item[]);
    setPayments((p.data ?? []) as Payment[]);
    if (!client) setActivity(await fetchActivity([invoice.id, ...((p.data ?? []) as Payment[]).map((x) => x.id)]));
  }, [invoice.id, client]);
  useEffect(() => { void load(); }, [load, invoice.status, invoice.paid_total]);

  const act = async (q: PromiseLike<{ error: { message: string; code?: string } | null }>, ok: string) => {
    const { error } = await q;
    if (error) { toast.error(errText(error)); return false; }
    toast.success(ok); await load(); reload(); return true;
  };
  const total = useMemo(() => invoiceTotal(items.map((i) => ({ quantity: Number(i.quantity), unit_price: Number(i.unit_price) }))), [items]);
  const due = balanceDue(Number(invoice.subtotal), Number(invoice.paid_total));
  const money = (n: number) => formatMoney(n, invoice.currency);

  const addItem = async () => {
    const q = Number(draft.quantity), u = Number(draft.unit_price);
    if (!draft.description.trim() || !(q > 0) || !(u >= 0) || draft.unit_price === '') { toast.error('Add a description, quantity and price.'); return; }
    if (await act(supabase.from('invoice_items').insert({ invoice_id: invoice.id, description: draft.description.trim(), quantity: q, unit_price: u }), 'Line added')) setDraft({ description: '', quantity: '1', unit_price: '' });
  };

  return (
    <div className="admin-invoice">
      <div className="admin-invoice-head">
        <Pill value={invoice.status} />
        <span>{invoice.issued_at ? `Issued ${fmtDate(invoice.issued_at, false)}` : 'Not sent yet'}</span>
        <span>{invoice.due_at ? `Due ${fmtDate(invoice.due_at, false)}` : 'No due date'}</span>
      </div>

      <div className="admin-lines">
        {items.length === 0 && <p className="admin-empty">No line items yet.</p>}
        {items.map((i) => (
          <div key={i.id} className="admin-line">
            <span className="min-w-0 break-words">{i.description}</span>
            <span className="admin-line-qty">{Number(i.quantity)} × {money(Number(i.unit_price))}</span>
            <strong>{money(Number(i.quantity) * Number(i.unit_price))}</strong>
            {editable && <button aria-label="Remove line" className="admin-icon-btn" onClick={() => confirm({ title: 'Remove this line?', description: i.description, confirmLabel: 'Remove', danger: true, run: () => act(supabase.from('invoice_items').delete().eq('id', i.id), 'Line removed') })}><Trash2 size={15} /></button>}
          </div>
        ))}
        {editable && (
          <div className="admin-line-add">
            <input aria-label="Description" placeholder="Description" maxLength={300} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            <input aria-label="Quantity" inputMode="decimal" placeholder="Qty" value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: e.target.value })} />
            <input aria-label="Unit price" inputMode="decimal" placeholder="Unit price" value={draft.unit_price} onChange={(e) => setDraft({ ...draft, unit_price: e.target.value })} />
            <button className="admin-btn-ghost" onClick={addItem}><Plus size={15} /> Add</button>
          </div>
        )}
        <div className="admin-totals">
          <div><span>Total</span><strong>{money(total)}</strong></div>
          <div><span>Paid</span><strong>{money(Number(invoice.paid_total))}</strong></div>
          <div className="is-due"><span>Balance due</span><strong>{money(due)}</strong></div>
        </div>
      </div>

      {invoice.notes && <p className="admin-note">{invoice.notes}</p>}

      {payments.length > 0 && (<>
        <h3 className="admin-sub">Payments</h3>
        <ul className="admin-payments">{payments.map((p) => <li key={p.id}><span>{fmtDate(p.paid_at, false)} · {label(p.method)}{p.reference ? ` · ${p.reference}` : ''}</span><strong>{money(Number(p.amount))}</strong></li>)}</ul>
      </>)}

      <div className="admin-dialog-actions is-spread">
        <button className="admin-btn-ghost" onClick={() => printInvoice(invoice, items, payments)}><Printer size={15} /> Print / PDF</button>
        {manager && !client && (
          <div className="admin-actions">
            {invoice.status === 'draft' && <button className="admin-btn-ghost is-danger" onClick={() => confirm({ title: 'Delete this draft?', description: 'The draft and its lines are removed. This cannot be undone.', confirmLabel: 'Delete draft', danger: true, run: async () => { const ok = await act(supabase.from('invoices').delete().eq('id', invoice.id), 'Draft deleted'); if (ok) onDeleted?.(); return ok; } })}>Delete</button>}
            {canVoid(invoice.status, Number(invoice.paid_total)) && invoice.status !== 'draft' && <button className="admin-btn-ghost is-danger" onClick={() => confirm({ title: 'Void this invoice?', description: 'A void invoice can no longer be paid or changed.', confirmLabel: 'Void invoice', danger: true, run: () => act(supabase.from('invoices').update({ status: 'void' }).eq('id', invoice.id), 'Invoice voided') })}>Void</button>}
            {invoice.status === 'draft' && <button className="admin-btn" disabled={total <= 0} onClick={() => confirm({ title: 'Send this invoice?', description: `An invoice number is assigned and the client can see it in their billing page. Total ${money(total)}.`, confirmLabel: 'Send invoice', run: () => act(supabase.from('invoices').update({ status: 'sent' }).eq('id', invoice.id), 'Invoice sent') })}>Send invoice</button>}
            {canRecordPayment(invoice.status) && <button className="admin-btn" onClick={() => setPayOpen(true)}>Record payment</button>}
          </div>
        )}
      </div>

      {!client && (<><h3 className="admin-sub">Activity</h3><Timeline rows={activity} names={names} /></>)}
      {payOpen && <PaymentDialog invoice={invoice} due={due} onClose={() => setPayOpen(false)} onSaved={async () => { setPayOpen(false); await load(); reload(); }} />}
      {node}
    </div>
  );
}

function PaymentDialog({ invoice, due, onClose, onSaved }: { invoice: Invoice; due: number; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ amount: String(due), method: 'bank', reference: '', paid_at: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }) });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    const amount = Number(form.amount);
    const problem = validatePayment(amount, Number(invoice.subtotal), Number(invoice.paid_total));
    if (problem) { toast.error(problem); return; }
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from('payments').insert({ invoice_id: invoice.id, amount, method: form.method, reference: form.reference.trim() || null, paid_at: form.paid_at, recorded_by: u.user?.id });
    setBusy(false);
    if (error) { toast.error(errText(error)); return; }
    toast.success('Payment recorded');
    onSaved();
  };
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title="Record payment" description={`Balance due ${formatMoney(due, invoice.currency)}. Payments cannot be edited once saved.`}>
      <div className="admin-form">
        <div className="admin-form-row">
          <label>Amount<input inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
          <label>Date<input type="date" value={form.paid_at} onChange={(e) => setForm({ ...form, paid_at: e.target.value })} /></label>
        </div>
        <label>Method<select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>{PAYMENT_METHODS.map((m) => <option key={m} value={m}>{label(m)}</option>)}</select></label>
        <label>Reference (optional)<input maxLength={120} placeholder="Transaction ID" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></label>
        <div className="admin-dialog-actions"><button className="admin-btn-ghost" onClick={onClose}>Cancel</button><button className="admin-btn" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save payment'}</button></div>
      </div>
    </Modal>
  );
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
function printInvoice(inv: Invoice, items: Item[], payments: Payment[]) {
  const m = (n: number) => esc(formatMoney(n, inv.currency));
  const w = window.open('', '_blank', 'width=820,height=1000');
  if (!w) { toast.error('Allow pop-ups to print the invoice.'); return; }
  const rows = items.map((i) => `<tr><td>${esc(i.description)}</td><td>${Number(i.quantity)}</td><td>${m(Number(i.unit_price))}</td><td>${m(Number(i.quantity) * Number(i.unit_price))}</td></tr>`).join('');
  w.document.write(`<!doctype html><title>${esc(inv.number ?? 'Draft invoice')}</title><style>body{font:14px/1.5 Inter,system-ui,sans-serif;color:#111;padding:48px;max-width:760px;margin:auto}h1{font-size:28px;margin:0}table{width:100%;border-collapse:collapse;margin:32px 0}td,th{padding:10px 8px;border-bottom:1px solid #ddd;text-align:left}td:not(:first-child),th:not(:first-child){text-align:right}.top{display:flex;justify-content:space-between;gap:24px}.tot{margin-left:auto;width:280px}.tot div{display:flex;justify-content:space-between;padding:4px 0}.due{font-weight:700;border-top:2px solid #111;margin-top:6px;padding-top:8px!important}small{color:#666}</style>
<div class="top"><div><h1>Admakai</h1><small>AI video studio · Dhaka · hello@admakai.com</small></div><div style="text-align:right"><strong>${esc(inv.number ?? 'DRAFT')}</strong><br><small>${inv.issued_at ? 'Issued ' + esc(fmtDate(inv.issued_at, false)) : 'Not issued'}${inv.due_at ? '<br>Due ' + esc(fmtDate(inv.due_at, false)) : ''}</small></div></div>
<p style="margin-top:32px"><small>Billed to</small><br><strong>${esc(clientName(inv.clients))}</strong>${inv.clients?.email ? '<br>' + esc(inv.clients.email) : ''}</p>
<table><thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>
<div class="tot"><div><span>Total</span><span>${m(Number(inv.subtotal))}</span></div><div><span>Paid</span><span>${m(payments.reduce((s, p) => s + Number(p.amount), 0))}</span></div><div class="due"><span>Balance due</span><span>${m(balanceDue(Number(inv.subtotal), Number(inv.paid_total)))}</span></div></div>
${inv.notes ? `<p style="margin-top:32px">${esc(inv.notes)}</p>` : ''}<script>onload=()=>print()</script>`);
  w.document.close();
}
