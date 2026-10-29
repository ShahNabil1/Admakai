import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { isStaffRole, startHubSignIn, type StaffRole } from '@/lib/sso';
import './admin.css';

type Booking = { id: string; slot_at: string; status: string; budget_band: string | null; owner_id: string | null; clients: { contact_name: string | null; email: string | null } | null };
type Lead = { id: string; stage: string; owner_id: string | null; value_estimate: number | null; stage_changed_at: string; clients: { contact_name: string | null; email: string | null } | null };

const BOOKING_STATUSES = ['requested', 'in_review', 'confirmed', 'completed', 'cancelled', 'no_show'];
const LEAD_STAGES = ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'];
const fmt = (iso: string) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));

export function AdminPage() {
  const [state, setState] = useState<'loading' | 'denied' | { role: StaffRole; userId: string; email: string }>('loading');
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { startHubSignIn(); return; }
      const { data: r } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).maybeSingle();
      setState(isStaffRole(r?.role) ? { role: r.role, userId: data.user.id, email: data.user.email ?? '' } : 'denied');
    })();
  }, []);
  if (state === 'loading') return <main className="admin-center"><div className="admin-card"><p>Checking your Branta Hub access…</p></div></main>;
  if (state === 'denied') return (
    <main className="admin-center"><div className="admin-card">
      <h1>No admin access</h1><p>This account is not an Admakai staff account in Branta Hub.</p>
      <button className="admin-btn" onClick={async () => { await supabase.auth.signOut(); startHubSignIn(); }}>Sign in with Branta Hub</button>
    </div></main>
  );
  return <AdminShell {...state} />;
}

function AdminShell({ role, userId, email }: { role: StaffRole; userId: string; email: string }) {
  const [tab, setTab] = useState<'today' | 'bookings' | 'leads'>('today');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const manager = role !== 'member';

  const load = useCallback(async () => {
    const [b, l] = await Promise.all([
      supabase.from('bookings').select('id, slot_at, status, budget_band, owner_id, clients(contact_name, email)').order('slot_at').limit(200),
      supabase.from('leads').select('id, stage, owner_id, value_estimate, stage_changed_at, clients(contact_name, email)').order('stage_changed_at', { ascending: false }).limit(300),
    ]);
    if (b.error || l.error) setMsg('Some data could not be loaded.');
    setBookings((b.data ?? []) as unknown as Booking[]);
    setLeads((l.data ?? []) as unknown as Lead[]);
  }, []);

  useEffect(() => {
    void load();
    const ch = supabase.channel('admin-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [load]);

  const update = async (table: 'bookings' | 'leads', id: string, patch: Record<string, unknown>) => {
    setMsg(null);
    const { error } = await supabase.from(table).update(patch).eq('id', id);
    if (error) setMsg(error.code === '42501' ? 'You do not have permission for that change.' : error.message);
    void load();
  };

  const now = Date.now();
  const todayKey = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
  const todays = bookings.filter((b) => new Date(b.slot_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }) === todayKey && !['cancelled', 'rescheduled'].includes(b.status));
  const pending = bookings.filter((b) => b.status === 'requested' || b.status === 'in_review');
  const stale = leads.filter((l) => ['new', 'contacted'].includes(l.stage) && now - new Date(l.stage_changed_at).getTime() > 2 * 86400000);

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <strong className="admin-brand">Admakai</strong>
        {(['today', 'bookings', 'leads'] as const).map((t) => (
          <button key={t} className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>{t[0]!.toUpperCase() + t.slice(1)}</button>
        ))}
        <div className="admin-me"><span>{email}</span><small>{role}</small>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.assign('/'); }}>Sign out</button>
        </div>
      </aside>
      <main className="admin-main">
        {msg && <p className="admin-alert" role="alert">{msg}</p>}
        {tab === 'today' && (
          <>
            <h1>Today</h1>
            <div className="admin-stats">
              <div><b>{todays.length}</b><span>Calls today</span></div>
              <div><b>{pending.length}</b><span>Bookings to review</span></div>
              <div><b>{stale.length}</b><span>Leads needing follow-up</span></div>
            </div>
            <h2>Today's calls</h2>
            <BookingTable rows={todays} manager={manager} userId={userId} update={update} />
            <h2>Follow-ups</h2>
            <LeadList rows={stale} manager={manager} userId={userId} update={update} />
          </>
        )}
        {tab === 'bookings' && (<><h1>Bookings</h1><BookingTable rows={bookings} manager={manager} userId={userId} update={update} /></>)}
        {tab === 'leads' && (
          <><h1>Leads</h1>
            <div className="admin-kanban">
              {LEAD_STAGES.map((s) => (
                <section key={s}><h3>{s} <small>{leads.filter((l) => l.stage === s).length}</small></h3>
                  <LeadList rows={leads.filter((l) => l.stage === s)} manager={manager} userId={userId} update={update} />
                </section>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

type Upd = (t: 'bookings' | 'leads', id: string, p: Record<string, unknown>) => Promise<void>;

function BookingTable({ rows, manager, userId, update }: { rows: Booking[]; manager: boolean; userId: string; update: Upd }) {
  if (!rows.length) return <p className="admin-empty">Nothing here yet.</p>;
  return (
    <div className="admin-table"><table>
      <thead><tr><th>When (Dhaka)</th><th>Client</th><th>Budget</th><th>Status</th><th>Owner</th></tr></thead>
      <tbody>{rows.map((b) => {
        const canEdit = manager || b.owner_id === userId;
        return (
          <tr key={b.id}>
            <td>{fmt(b.slot_at)}</td>
            <td>{b.clients?.contact_name ?? '—'}<small>{b.clients?.email}</small></td>
            <td>{b.budget_band ?? '—'}</td>
            <td><select value={b.status} disabled={!canEdit} onChange={(e) => update('bookings', b.id, { status: e.target.value })}>
              {BOOKING_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></td>
            <td>{b.owner_id === userId ? 'You' : b.owner_id ? 'Assigned' : manager
              ? <button className="admin-link" onClick={() => update('bookings', b.id, { owner_id: userId })}>Take</button> : '—'}</td>
          </tr>
        );
      })}</tbody>
    </table></div>
  );
}

function LeadList({ rows, manager, userId, update }: { rows: Lead[]; manager: boolean; userId: string; update: Upd }) {
  if (!rows.length) return <p className="admin-empty">None</p>;
  return (
    <ul className="admin-leads">{rows.map((l) => {
      const canEdit = manager || l.owner_id === userId;
      return (
        <li key={l.id}>
          <strong>{l.clients?.contact_name ?? 'Unnamed'}</strong><small>{l.clients?.email}</small>
          <div>
            <select value={l.stage} disabled={!canEdit} onChange={(e) => update('leads', l.id, { stage: e.target.value })}>
              {LEAD_STAGES.map((s) => <option key={s}>{s}</option>)}</select>
            {!l.owner_id && <button className="admin-link" onClick={() => update('leads', l.id, { owner_id: userId })}>Assign to me</button>}
          </div>
        </li>
      );
    })}</ul>
  );
}
