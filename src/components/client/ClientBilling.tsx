import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { balanceDue, formatMoney } from '@/lib/billing';
import { InvoiceDetail, type Invoice } from '@/components/admin/Billing';
import { Modal, Pill, fmtDate } from '@/components/admin/ui';
import { ClientEmpty } from './ClientPages';
import '@/components/admin/admin.css';

export function ClientBilling() {
  const [rows, setRows] = useState<Invoice[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const load = useCallback(async () => {
    const { data } = await supabase.from('invoices').select('id, number, client_id, project_id, status, currency, issued_at, due_at, notes, subtotal, paid_total, created_at, clients(contact_name, brand_name, email)').neq('status', 'draft').order('created_at', { ascending: false });
    setRows((data ?? []) as unknown as Invoice[]);
  }, []);
  useEffect(() => {
    void load();
    const ch = supabase.channel('client-billing').on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => void load()).subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [load]);
  if (rows === null) return <div className="client-content"><div className="admin-skeleton" /></div>;
  if (!rows.length) return <ClientEmpty title="Billing" />;
  const open = rows.find((r) => r.id === openId) ?? null;
  return (
    <div className="client-content">
      <header className="client-page-heading"><p>Your studio space</p><h1>Billing</h1></header>
      <div className="admin-grid">
        {rows.map((i) => (
          <button key={i.id} className="admin-card-item" onClick={() => setOpenId(i.id)}>
            <div className="admin-card-top"><strong className="truncate">{i.number}</strong><Pill value={i.status} /></div>
            <div className="admin-card-meta"><span>{formatMoney(Number(i.subtotal), i.currency)}</span><span>{i.due_at ? `Due ${fmtDate(i.due_at, false)}` : ''}</span></div>
            <p>Balance {formatMoney(balanceDue(Number(i.subtotal), Number(i.paid_total)), i.currency)}</p>
          </button>
        ))}
      </div>
      <Modal open={!!open} onOpenChange={(o) => !o && setOpenId(null)} title={open?.number ?? ''} wide>
        {open && <InvoiceDetail invoice={open} manager={false} names={{}} reload={load} client />}
      </Modal>
    </div>
  );
}
