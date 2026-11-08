import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { Toaster, toast } from 'sonner';
import { Activity, ArrowLeft, CalendarDays, Clapperboard, FolderKanban, LayoutDashboard, LogOut, Receipt, Search, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { adminAccessAllowed } from '@/lib/application-rules';
import { cancelHubPopupSignIn, isStaffRole, startHubPopupSignIn, startHubSignIn, type StaffRole } from '@/lib/sso';
import { Button } from '@/components/ui/button';
import type { ActivityRow } from '@/lib/activity';
import { StaffProjects } from '@/components/delivery/ProjectsWorkspace';
import { StaffBilling } from './Billing';
import { WorkAdmin } from './WorkAdmin';
import { ActivityLog, fetchActivity } from './ActivityLog';
import { BookingSubmission, type BookingSubmissionData } from './BookingSubmission';
import { Empty, Modal, Pill, Timeline, fmtDate, label, useConfirm } from './ui';
import './admin.css';

type ClientRef = { contact_name: string | null; email: string | null; brand_name?: string | null; whatsapp?: string | null } | null;
type Booking = BookingSubmissionData & { status: string; owner_id: string | null; meet_link: string | null; notes_shared: string | null };
type Lead = { id: string; stage: string; owner_id: string | null; value_estimate: number | null; currency: string | null; lost_reason_category: string | null; lost_reason: string | null; stage_changed_at: string; clients: ClientRef };
type Tab = 'today' | 'bookings' | 'leads' | 'projects' | 'work' | 'billing' | 'activity';

const BOOKING_STATUSES = ['requested', 'in_review', 'confirmed', 'completed', 'cancelled', 'no_show'];
const LEAD_STAGES = ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'];
const LOST_REASONS = ['budget', 'timing', 'went_elsewhere', 'no_response', 'not_a_fit', 'other'];
const NAV: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: 'today', label: 'Today', icon: LayoutDashboard },
  { id: 'bookings', label: 'Bookings', icon: CalendarDays },
  { id: 'leads', label: 'Pipeline', icon: Users },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'work', label: 'Work', icon: Clapperboard },
  { id: 'billing', label: 'Billing', icon: Receipt },
  { id: 'activity', label: 'Activity', icon: Activity },
];
const errText = (e: { message: string; code?: string }) => (e.code === '42501' ? 'You do not have permission for that change.' : e.message);
const who = (c: ClientRef) => c?.contact_name || c?.brand_name || 'Unnamed';

export function AdminPage() {
  const [state, setState] = useState<'loading' | 'signed-out' | 'denied' | { role: StaffRole; userId: string; email: string }>('loading');
  const [waiting, setWaiting] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const active = useRef(true);
  const checkVersion = useRef(0);
  const checkAccess = useCallback(async () => {
    const version = ++checkVersion.current;
    try {
      const { data } = await supabase.auth.getUser();
      if (!active.current || version !== checkVersion.current) return;
      if (!data.user) { setState('signed-out'); return; }
      const { data: r } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).maybeSingle();
      const { data: hiring, error: hiringError } = await supabase.rpc('is_hiring_staff', { _user_id: data.user.id });
      if (!active.current || version !== checkVersion.current) return;
      setState(adminAccessAllowed(r?.role, !hiringError && hiring === true) ? { role: isStaffRole(r?.role) ? r.role : 'member', userId: data.user.id, email: data.user.email ?? '' } : 'denied');
    } catch {
      if (active.current && version === checkVersion.current) { setState('signed-out'); setNote('Could not check your account. Please try again.'); }
    }
  }, []);
  useEffect(() => {
    active.current = true;
    void checkAccess();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // Defer auth calls until Supabase releases its auth-event lock.
      if (event === 'SIGNED_IN') window.setTimeout(() => { if (active.current) void checkAccess(); }, 0);
      if (event === 'SIGNED_OUT') { ++checkVersion.current; setState('signed-out'); }
    });
    return () => { active.current = false; ++checkVersion.current; subscription.unsubscribe(); cancelHubPopupSignIn(); };
  }, [checkAccess]);
  const signIn = () => {
    // Embedded previews partition storage from popups, so use the same-tab flow there.
    let embedded = true;
    try { embedded = window.self !== window.top; } catch { /* cross-origin parent */ }
    if (embedded) { startHubSignIn(); return; }
    setWaiting(true); setNote(null); setBlocked(false);
    // Open synchronously in the user gesture, before awaiting any auth calls.
    const result = startHubPopupSignIn();
    void result.then(async (outcome) => {
      if (!active.current) return;
      setWaiting(false);
      if (outcome === 'success') { await checkAccess(); return; }
      if (outcome === 'blocked') { setBlocked(true); setNote('Popup was blocked.'); }
      else if (outcome === 'closed') setNote('Sign-in window was closed.');
      else setNote(outcome.error);
    });
  };
  const deniedSignIn = async () => {
    await supabase.auth.signOut();
    if (active.current) signIn();
  };
  if (state === 'loading') return <main className="admin-center"><div className="admin-card"><div className="admin-spinner" /><p>Checking your Branta Hub access…</p></div></main>;
  if (state === 'denied') return (
    <main className="admin-center"><div className="admin-card">
      <h1>No admin access</h1><p>This account is not an Admakai staff account in Branta Hub.</p>
      <Button className="admin-btn" onClick={() => void deniedSignIn()}>Sign in with Branta Hub</Button>
    </div></main>
  );
  if (state === 'signed-out') return (
    <main className="admin-center sso-gate"><div className="admin-card sso-card">
      <span className="sso-badge"><img src="/brand/branta-icon.png" alt="" width="14" height="14" />A <b className="sso-glow">Branta Tech</b> sister concern</span>
      <img src="/brand/logo-white.png" alt="Admakai" className="sso-logo" width="218" height="44" />
      <h1 className="sso-title">Workspace</h1>
      <p className="sso-kicker">Single Sign-On Gateway</p>
      {waiting ? <div role="status" className="sso-wait"><div className="admin-spinner sso-spinner" /><p>Waiting for Branta Console…</p><Button variant="link" onClick={cancelHubPopupSignIn}>Cancel</Button></div> : <>
        {note && <p role="status" className="sso-note">{note}</p>}
        <button type="button" className="sso-btn" onClick={blocked ? startHubSignIn : signIn}>
          <span className="sso-btn-icon"><img src="/brand/branta-icon.png" alt="" width="20" height="20" /></span>
          <span className="sso-btn-label">{blocked ? 'Continue in this tab' : note && note !== 'Sign-in window was closed.' ? 'Try again' : 'Continue with Branta Console'}</span>
        </button>
      </>}
    </div></main>
  );
  return <AdminShell {...state} />;
}

function readTab(): Tab {
  const t = new URLSearchParams(window.location.search).get('tab');
  return NAV.some((n) => n.id === t) ? (t as Tab) : 'today';
}

function AdminShell({ role, userId, email }: { role: StaffRole; userId: string; email: string }) {
  const [tab, setTabState] = useState<Tab>(readTab);
  const setTab = useCallback((t: Tab) => {
    const url = new URL(window.location.href);
    if (t === 'today') url.searchParams.delete('tab'); else url.searchParams.set('tab', t);
    if (t !== 'work') { url.searchParams.delete('work'); url.searchParams.delete('work_id'); }
    window.history.pushState(null, '', url);
    setTabState(t);
  }, []);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [openBooking, setOpenBookingState] = useState<string | null>(() => new URLSearchParams(window.location.search).get('booking'));
  const setOpenBooking = useCallback((id: string | null) => {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('booking', id); else url.searchParams.delete('booking');
    window.history.pushState(null, '', url);
    setOpenBookingState(id); window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    const sync = () => {
      setOpenBookingState(new URLSearchParams(window.location.search).get('booking'));
      setTabState(readTab());
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  const [openLead, setOpenLead] = useState<string | null>(null);
  const manager = role !== 'member';
  const { confirm, node: confirmNode } = useConfirm();

  const load = useCallback(async () => {
    const [b, l] = await Promise.all([
      supabase.from('bookings').select('id, slot_at, duration_minutes, created_at, source, status, budget_band, owner_id, meet_link, notes_shared, brief, clients(contact_name, email, brand_name, whatsapp)').order('slot_at', { ascending: false }).limit(300),
      supabase.from('leads').select('id, stage, owner_id, value_estimate, currency, lost_reason_category, lost_reason, stage_changed_at, clients(contact_name, email, brand_name, whatsapp)').order('stage_changed_at', { ascending: false }).limit(400),
    ]);
    if (b.error || l.error) toast.error('Some data could not be loaded.');
    setBookings((b.data ?? []) as unknown as Booking[]);
    setLeads((l.data ?? []) as unknown as Lead[]);
  }, []);

  useEffect(() => {
    void load();
    void supabase.from('profiles').select('user_id, full_name, email').limit(500).then(({ data }) => {
      const m: Record<string, string> = {};
      for (const p of data ?? []) m[p.user_id] = p.full_name || p.email;
      setNames(m);
    });
    const ch = supabase.channel('admin-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [load]);

  const update = async (table: 'bookings' | 'leads', id: string, patch: Record<string, unknown>, ok = 'Saved') => {
    const { error } = await supabase.from(table).update(patch).eq('id', id);
    if (error) { toast.error(errText(error)); return false; }
    toast.success(ok); void load(); return true;
  };

  const changeLeadStage = (lead: Lead, stage: string) => {
    if (stage === lead.stage) return;
    if (!(manager || lead.owner_id === userId)) { toast.error('Assign this lead to yourself first.'); return; }
    if (stage === 'lost') { setOpenLead(lead.id); toast.message('Choose a reason to mark this lead lost.'); return; }
    if (stage === 'won') {
      confirm({ title: 'Mark this lead won?', description: `A project for ${who(lead.clients)} opens automatically and the client becomes a customer.`, confirmLabel: 'Mark won', run: () => update('leads', lead.id, { stage }, 'Lead won: project created') });
      return;
    }
    void update('leads', lead.id, { stage }, `Moved to ${label(stage)}`);
  };

  const todayKey = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
  const all = bookings ?? [];
  const todays = all.filter((b) => new Date(b.slot_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }) === todayKey && !['cancelled', 'rescheduled'].includes(b.status)).sort((a, b) => a.slot_at.localeCompare(b.slot_at));
  const pending = all.filter((b) => b.status === 'requested' || b.status === 'in_review');
  const now = Date.now();
  const stale = (leads ?? []).filter((l) => ['new', 'contacted'].includes(l.stage) && now - new Date(l.stage_changed_at).getTime() > 2 * 86400000);
  const booking = all.find((b) => b.id === openBooking) ?? null;
  const lead = (leads ?? []).find((l) => l.id === openLead) ?? null;

  return (
    <>
      <Toaster position="top-center" theme="dark" richColors closeButton />
    <div className="admin-shell">

      <aside className="admin-side" aria-label="Admin navigation">
        <strong className="admin-brand">Admakai<small>Studio admin</small></strong>
        <nav>
          {NAV.map((n) => (
            <button key={n.id} className={tab === n.id ? 'is-active' : ''} aria-current={tab === n.id ? 'page' : undefined} onClick={() => { setTab(n.id); if (openBooking) setOpenBooking(null); }}>
              <n.icon size={17} /><span>{n.label}</span>
              {n.id === 'bookings' && pending.length > 0 && <em>{pending.length}</em>}
            </button>
          ))}
        </nav>
        <div className="admin-me"><span className="truncate">{email}</span><small>{role}</small>
          <button onClick={() => confirm({ title: 'Sign out?', description: 'You will need Branta Hub to sign in again.', confirmLabel: 'Sign out', run: async () => { await supabase.auth.signOut(); window.location.assign('/'); } })}><LogOut size={14} /> Sign out</button>
        </div>
      </aside>

      <header className="admin-topbar">
        <strong className="admin-brand">Admakai</strong>
        <button className="admin-icon-btn" aria-label="Sign out" onClick={() => confirm({ title: 'Sign out?', description: 'You will need Branta Hub to sign in again.', confirmLabel: 'Sign out', run: async () => { await supabase.auth.signOut(); window.location.assign('/'); } })}><LogOut size={17} /></button>
      </header>

      <main className="admin-main" key={openBooking ? `booking-${openBooking}` : tab}>
        {openBooking ? (
          <section className="booking-page">
            <button className="admin-btn-ghost booking-page-back" onClick={() => { setTab('bookings'); setOpenBooking(null); }}><ArrowLeft size={16} />Back to bookings</button>
            {booking ? <>
              <header className="admin-head"><div><p className="admin-eyebrow">{fmtDate(booking.slot_at)} · Dhaka time</p><h1>{who(booking.clients)}</h1></div><Pill value={booking.status} /></header>
              <div className="admin-panel"><BookingDetail key={booking.id} b={booking} manager={manager} userId={userId} names={names} update={update} confirm={confirm} /></div>
            </> : bookings === null ? <div className="admin-skeleton" /> : <Empty title="Booking not found" hint="It may have been removed or you may not have access." />}
          </section>
        ) : <>
        {tab === 'today' && (
          <section>
            <header className="admin-head"><div><p className="admin-eyebrow">{fmtDate(new Date().toISOString(), false)}</p><h1>Today</h1></div></header>
            <div className="admin-stats">
              <button className="admin-stat" onClick={() => setTab('bookings')}><span>Calls today</span><b>{todays.length}</b></button>
              <button className="admin-stat" onClick={() => setTab('bookings')}><span>Bookings to review</span><b>{pending.length}</b></button>
              <button className="admin-stat" onClick={() => setTab('leads')}><span>Leads needing follow-up</span><b>{stale.length}</b></button>
            </div>
            <h2 className="admin-sub">Today's calls</h2>
            {bookings === null ? <div className="admin-skeleton" /> : todays.length ? <div className="admin-grid">{todays.map((b) => <BookingCard key={b.id} b={b} names={names} userId={userId} onOpen={() => setOpenBooking(b.id)} />)}</div> : <Empty title="No calls today" hint="New bookings show up here in real time." />}
            <h2 className="admin-sub">Follow-ups</h2>
            {stale.length ? <div className="admin-grid">{stale.map((l) => <LeadCard key={l.id} l={l} names={names} userId={userId} onOpen={() => setOpenLead(l.id)} />)}</div> : <Empty title="Everyone is followed up" />}
          </section>
        )}
        {tab === 'bookings' && <BookingsView rows={bookings} names={names} userId={userId} onOpen={setOpenBooking} />}
        {tab === 'leads' && <Pipeline rows={leads} names={names} userId={userId} onOpen={setOpenLead} onMove={changeLeadStage} />}
        {tab === 'projects' && <StaffProjects userId={userId} />}
        {tab === 'work' && <WorkAdmin />}
        {tab === 'billing' && <StaffBilling manager={manager} names={names} />}
        {tab === 'activity' && <ActivityLog names={names} />}
        </>}
      </main>

      <nav className="admin-tabbar" aria-label="Admin sections">
        {NAV.map((n) => (
          <button key={n.id} className={tab === n.id ? 'is-active' : ''} aria-current={tab === n.id ? 'page' : undefined} onClick={() => { setTab(n.id); if (openBooking) setOpenBooking(null); }}>
            <n.icon size={19} /><span>{n.label}</span>
          </button>
        ))}
      </nav>

      <Modal open={!!lead} onOpenChange={(o) => !o && setOpenLead(null)} title={lead ? who(lead.clients) : ''} description={lead?.clients?.email ?? undefined} wide>
        {lead && <LeadDetail l={lead} manager={manager} userId={userId} names={names} update={update} onStage={(s) => changeLeadStage(lead, s)} />}
      </Modal>
      {confirmNode}
    </div>
    </>
  );
}

function BookingCard({ b, names, userId, onOpen }: { b: Booking; names: Record<string, string>; userId: string; onOpen: () => void }) {
  return (
    <button className="admin-card-item" onClick={onOpen}>
      <div className="admin-card-top"><strong className="truncate">{who(b.clients)}</strong><Pill value={b.status} /></div>
      <p className="truncate">{b.clients?.email ?? 'Not supplied'}</p>
      <div className="admin-card-meta"><span>{fmtDate(b.slot_at)}</span><span className="truncate">{b.owner_id ? b.owner_id === userId ? 'You' : names[b.owner_id] ?? 'Assigned' : 'Unassigned'}</span></div>
    </button>
  );
}

function BookingsView({ rows, names, userId, onOpen }: { rows: Booking[] | null; names: Record<string, string>; userId: string; onOpen: (id: string) => void }) {
  const [filter, setFilter] = useState('open');
  const [q, setQ] = useState('');
  const list = rows ?? [];
  const shown = list.filter((b) => (filter === 'all' || (filter === 'open' ? ['requested', 'in_review', 'confirmed'].includes(b.status) : b.status === filter))
    && (!q || `${b.clients?.contact_name} ${b.clients?.email} ${b.clients?.brand_name}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <section>
      <header className="admin-head"><div><p className="admin-eyebrow">Calls</p><h1>Bookings</h1></div>
        <label className="admin-search"><Search size={15} /><input type="search" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      </header>
      <div className="admin-chips">
        {['open', 'all', ...BOOKING_STATUSES].map((s) => <button key={s} className={filter === s ? 'is-active' : ''} onClick={() => setFilter(s)}>{label(s)}</button>)}
      </div>
      {rows === null ? <div className="admin-skeleton" /> : shown.length ? <div className="admin-grid">{shown.map((b) => <BookingCard key={b.id} b={b} names={names} userId={userId} onOpen={() => onOpen(b.id)} />)}</div> : <Empty title="No bookings match" />}
    </section>
  );
}

type Upd = (t: 'bookings' | 'leads', id: string, p: Record<string, unknown>, ok?: string) => Promise<boolean>;

function useEntityActivity(id: string, dep: unknown) {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  useEffect(() => { void fetchActivity([id]).then(setRows); }, [id, dep]);
  return rows;
}

function BookingDetail({ b, manager, userId, names, update, confirm }: { b: Booking; manager: boolean; userId: string; names: Record<string, string>; update: Upd; confirm: ReturnType<typeof useConfirm>['confirm'] }) {
  const canEdit = manager || b.owner_id === userId;
  const [link, setLink] = useState(b.meet_link ?? '');
  const [notes, setNotes] = useState(b.notes_shared ?? '');
  const activity = useEntityActivity(b.id, b.status);
  const setStatus = (s: string) => {
    if (['cancelled', 'no_show', 'completed'].includes(s)) {
      confirm({ title: `Mark booking ${label(s)}?`, description: s === 'cancelled' ? 'The time slot becomes available again for other clients.' : 'This is recorded permanently in the activity log.', confirmLabel: `Mark ${label(s)}`, danger: s !== 'completed', run: () => update('bookings', b.id, { status: s }, `Booking ${label(s)}`) });
    } else void update('bookings', b.id, { status: s }, `Booking ${label(s)}`);
  };
  return (
    <div className="admin-detail">
      <BookingSubmission booking={b} />
        <div className="admin-side-panel booking-management">
          <p className="admin-label">Status</p>
          <div className="admin-segment">
            {BOOKING_STATUSES.map((s) => <button key={s} disabled={!canEdit} className={b.status === s ? 'is-active' : ''} onClick={() => s !== b.status && setStatus(s)}>{label(s)}</button>)}
          </div>
          <p className="admin-label">Owner</p>
          {b.owner_id ? <p>{b.owner_id === userId ? 'You' : names[b.owner_id] ?? 'Assigned'}</p> : manager ? <button className="admin-btn-ghost" onClick={() => update('bookings', b.id, { owner_id: userId }, 'Booking assigned to you')}>Take this booking</button> : <p>Unassigned</p>}
        </div>
      {canEdit && (
        <div className="admin-form">
          <label>Meeting link<input type="url" placeholder="https://meet.google.com/…" value={link} onChange={(e) => setLink(e.target.value)} /></label>
          <label>Notes shared with the client<textarea rows={3} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
          <div className="admin-dialog-actions"><button className="admin-btn" disabled={link === (b.meet_link ?? '') && notes === (b.notes_shared ?? '')} onClick={() => {
            if (link && !/^https:\/\//.test(link)) { toast.error('The meeting link must start with https://'); return; }
            void update('bookings', b.id, { meet_link: link || null, notes_shared: notes.trim() || null }, 'Booking details saved');
          }}>Save details</button></div>
        </div>
      )}
      {!canEdit && <dl className="admin-facts"><div><dt>Meeting link</dt><dd>{b.meet_link || 'Not provided'}</dd></div><div><dt>Notes shared with the client</dt><dd className="booking-submission-message">{b.notes_shared || 'Not provided'}</dd></div></dl>}
      <h3 className="admin-sub">Activity</h3>
      <Timeline rows={activity} names={names} />
    </div>
  );
}

function LeadCard({ l, names, userId, onOpen, draggable }: { l: Lead; names: Record<string, string>; userId: string; onOpen: () => void; draggable?: boolean }) {
  const days = Math.floor((Date.now() - new Date(l.stage_changed_at).getTime()) / 86400000);
  return (
    <button className="admin-card-item is-lead" onClick={onOpen} draggable={draggable} onDragStart={(e: DragEvent) => e.dataTransfer.setData('text/lead', l.id)}>
      <div className="admin-card-top"><strong className="truncate">{who(l.clients)}</strong>{l.value_estimate ? <small>{l.currency ?? 'BDT'} {l.value_estimate.toLocaleString()}</small> : null}</div>
      <p className="truncate">{l.clients?.email ?? 'Not supplied'}</p>
      <div className="admin-card-meta"><span>{days === 0 ? 'Today' : `${days}d in stage`}</span><span className="truncate">{l.owner_id ? l.owner_id === userId ? 'You' : names[l.owner_id] ?? 'Assigned' : 'Unassigned'}</span></div>
    </button>
  );
}

function Pipeline({ rows, names, userId, onOpen, onMove }: { rows: Lead[] | null; names: Record<string, string>; userId: string; onOpen: (id: string) => void; onMove: (l: Lead, s: string) => void }) {
  const [over, setOver] = useState<string | null>(null);
  const list = rows ?? [];
  const totals = useMemo(() => Object.fromEntries(LEAD_STAGES.map((s) => [s, list.filter((l) => l.stage === s)])), [list]);
  return (
    <section>
      <header className="admin-head"><div><p className="admin-eyebrow">Sales</p><h1>Pipeline</h1></div><p className="admin-hint">Drag a card to another stage, or open it to update.</p></header>
      {rows === null ? <div className="admin-skeleton" /> : (
        <div className="admin-kanban">
          {LEAD_STAGES.map((s) => (
            <section key={s} className={`admin-col ${over === s ? 'is-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setOver(s); }} onDragLeave={() => setOver(null)}
              onDrop={(e) => { e.preventDefault(); setOver(null); const l = list.find((x) => x.id === e.dataTransfer.getData('text/lead')); if (l) onMove(l, s); }}>
              <h3><span className={`admin-dot is-${s}`} />{label(s)}<small>{totals[s]!.length}</small></h3>
              <div className="admin-col-body">
                {totals[s]!.length ? totals[s]!.map((l) => <LeadCard key={l.id} l={l} names={names} userId={userId} onOpen={() => onOpen(l.id)} draggable />) : <p className="admin-empty">Drop leads here</p>}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function LeadDetail({ l, manager, userId, names, update, onStage }: { l: Lead; manager: boolean; userId: string; names: Record<string, string>; update: Upd; onStage: (s: string) => void }) {
  const canEdit = manager || l.owner_id === userId;
  const [value, setValue] = useState(l.value_estimate?.toString() ?? '');
  const [reason, setReason] = useState({ cat: l.lost_reason_category ?? '', text: l.lost_reason ?? '' });
  const activity = useEntityActivity(l.id, l.stage);
  return (
    <div className="admin-detail">
      <p className="admin-label">Stage</p>
      <div className="admin-stepper">
        {LEAD_STAGES.map((s, i) => (
          <button key={s} disabled={!canEdit} className={`${l.stage === s ? 'is-active' : ''} ${LEAD_STAGES.indexOf(l.stage) > i && l.stage !== 'lost' ? 'is-done' : ''}`} onClick={() => s !== 'lost' && onStage(s)}>{label(s)}</button>
        ))}
      </div>
      <div className="admin-detail-grid">
        <dl className="admin-facts">
          <div><dt>WhatsApp</dt><dd>{l.clients?.whatsapp ?? 'Not supplied'}</dd></div>
          <div><dt>Brand</dt><dd>{l.clients?.brand_name ?? 'Not supplied'}</dd></div>
          <div><dt>Owner</dt><dd>{l.owner_id ? l.owner_id === userId ? 'You' : names[l.owner_id] ?? 'Assigned' : 'Unassigned'}</dd></div>
          <div><dt>In stage since</dt><dd>{fmtDate(l.stage_changed_at)}</dd></div>
        </dl>
        <div className="admin-side-panel">
          {!l.owner_id && <button className="admin-btn" onClick={() => update('leads', l.id, { owner_id: userId }, 'Lead assigned to you')}>Assign to me</button>}
          {canEdit && (<>
            <label className="admin-form">Estimated value (BDT)<input inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))} /></label>
            <button className="admin-btn-ghost" disabled={value === (l.value_estimate?.toString() ?? '')} onClick={() => update('leads', l.id, { value_estimate: value ? Number(value) : null }, 'Value saved')}>Save value</button>
          </>)}
        </div>
      </div>
      {canEdit && l.stage !== 'lost' && l.stage !== 'won' && (
        <div className="admin-lost">
          <p className="admin-label">Mark as lost</p>
          <div className="admin-form-row">
            <select aria-label="Lost reason" value={reason.cat} onChange={(e) => setReason({ ...reason, cat: e.target.value })}><option value="">Choose a reason</option>{LOST_REASONS.map((r) => <option key={r} value={r}>{label(r)}</option>)}</select>
            <input aria-label="Details" placeholder="Details (optional)" maxLength={500} value={reason.text} onChange={(e) => setReason({ ...reason, text: e.target.value })} />
          </div>
          <button className="admin-btn-ghost is-danger" disabled={!reason.cat} onClick={() => update('leads', l.id, { stage: 'lost', lost_reason_category: reason.cat, lost_reason: reason.text.trim() || null }, 'Lead marked lost')}>Mark lost</button>
        </div>
      )}
      {l.stage === 'lost' && <p className="admin-note">Lost: {label(l.lost_reason_category ?? 'no reason')}{l.lost_reason ? `: ${l.lost_reason}` : ''}</p>}
      <h3 className="admin-sub">Activity</h3>
      <Timeline rows={activity} names={names} />
    </div>
  );
}
