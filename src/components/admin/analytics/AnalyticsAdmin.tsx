import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDuration, pageName, percent } from '@/lib/analytics-rules';
import './analytics-admin.css';

type Report = {
  totals: { visitors: number; new_visitors: number; sessions: number; pageviews: number; avg_session_secs: number; bounces: number; enquiries: number; bookings: number };
  daily: { day: string; pageviews: number; sessions: number }[];
  pages: { path: string; views: number; visitors: number; secs: number; scroll: number | null; exits: number }[];
  flows: { from: string; to: string; n: number }[];
  funnel: Record<'book_click' | 'book_open' | 'step1' | 'step2' | 'step3' | 'details' | 'booked', number>;
  clicks: { label: string; path: string; n: number }[];
  sources: { source: string; n: number }[];
  devices: Record<string, number>;
  browsers: Record<string, number>;
  zones: { tz: string; n: number }[];
  videos: { title: string; n: number }[];
  live: { n: number; pages: string[] };
  sessions: { id: string; started: string; secs: number; pages: number; booked: boolean; entry: string; source: string; device: string | null }[];
};
type Draft = { id: string; name: string | null; email: string | null; whatsapp: string | null; brand: string | null; interest: string | null; step: number; status: string; updated_at: string };
type Range = 'today' | '7' | '30' | '90';
type TimelineRow = { created_at: string; kind: string; path: string; label: string | null; value: number | null };

const dhaka = (iso: string) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
function rangeStart(r: Range): Date {
  if (r === 'today') { const d = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date()); return new Date(`${d}T00:00:00+06:00`); }
  return new Date(Date.now() - Number(r) * 86400_000);
}

export function AnalyticsAdmin() {
  const [range, setRange] = useState<Range>('7');
  const [report, setReport] = useState<Report | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [showAllDrafts, setShowAllDrafts] = useState(false);
  const [openSession, setOpenSession] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<TimelineRow[]>([]);
  const [busy, setBusy] = useState(true);

  const load = useCallback(async () => {
    setBusy(true);
    const [r, d] = await Promise.all([
      supabase.rpc('analytics_report', { _from: rangeStart(range).toISOString(), _to: new Date(Date.now() + 60_000).toISOString() }),
      supabase.from('booking_drafts').select('id, name, email, whatsapp, brand, interest, step, status, updated_at').order('updated_at', { ascending: false }).limit(200),
    ]);
    if (r.error || d.error) toast.error('Analytics could not load. Please refresh.');
    setReport((r.data as unknown as Report) ?? null);
    setDrafts((d.data ?? []) as Draft[]);
    setBusy(false);
  }, [range]);
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!openSession) return;
    void supabase.from('analytics_events').select('created_at, kind, path, label, value').eq('session_id', openSession).order('created_at').limit(500)
      .then(({ data }) => setTimeline((data ?? []) as TimelineRow[]));
  }, [openSession]);

  const setDraftStatus = async (id: string, status: string) => {
    const { error } = status === 'deleted' ? await supabase.from('booking_drafts').delete().eq('id', id) : await supabase.from('booking_drafts').update({ status }).eq('id', id);
    if (error) { toast.error('Could not save that change.'); return; }
    toast.success(status === 'deleted' ? 'Deleted' : 'Saved'); void load();
  };

  const t = report?.totals;
  const visibleDrafts = drafts.filter(d => showAllDrafts ? true : d.status === 'open' || d.status === 'contacted');
  const avgPage = t && t.pageviews ? (report!.pages.reduce((s, p) => s + p.secs, 0) / t.pageviews) : 0;

  return (
    <div className="an-root">
      <header className="an-head">
        <div><p className="an-eyebrow">Analytics</p><h1>How visitors use admakai.com</h1><p className="an-sub">Dhaka time. Your team’s own visits are not counted.</p></div>
        <div className="an-controls">
          {(['today', '7', '30', '90'] as Range[]).map(r => <button key={r} type="button" className={`an-pill ${range === r ? 'is-on' : ''}`} onClick={() => setRange(r)}>{r === 'today' ? 'Today' : `${r} days`}</button>)}
          <button type="button" className="an-pill" onClick={() => void load()} aria-label="Refresh"><RefreshCw size={14} className={busy ? 'an-spin' : ''} /></button>
        </div>
      </header>

      {!report ? <p className="an-empty">{busy ? 'Loading…' : 'No data yet.'}</p> : <>
        <div className="an-live"><span className="an-dot" /> <strong>{report.live.n}</strong> on the site now {report.live.pages.length > 0 && <span>· {report.live.pages.slice(0, 5).map(pageName).join(', ')}</span>}</div>

        <section className="an-cards">
          <Card label="Visitors" value={t!.visitors} note={`${t!.new_visitors} new`} />
          <Card label="Visits" value={t!.sessions} />
          <Card label="Page views" value={t!.pageviews} />
          <Card label="Avg. time on site" value={formatDuration(t!.avg_session_secs)} />
          <Card label="Avg. time per page" value={formatDuration(avgPage)} />
          <Card label="Left after one page" value={`${percent(t!.bounces, t!.sessions)}%`} />
          <Card label="Booked a call" value={t!.bookings} note={`${percent(report.funnel.booked, t!.sessions)}% of visits`} />
          <Card label="Enquiries" value={t!.enquiries} />
        </section>

        {t!.sessions < 100 && <p className="an-note">Only {t!.sessions} visits in this period, so treat percentages as early signs, not conclusions.</p>}

        <Panel title="Visits over time"><LineChart daily={report.daily} /></Panel>

        <div className="an-grid2">
          <Panel title="Booking funnel"><Funnel f={report.funnel} /></Panel>
          <Panel title={`Unfinished bookings (${drafts.filter(d => d.status === 'open').length} open)`} action={<button type="button" className="an-link" onClick={() => setShowAllDrafts(v => !v)}>{showAllDrafts ? 'Hide finished' : 'Show all'}</button>}>
            {visibleDrafts.length === 0 ? <p className="an-empty">No unfinished bookings.</p> :
              <ul className="an-drafts">{visibleDrafts.map(d => <li key={d.id}>
                <div className="an-draft-main"><strong>{d.name || 'No name given'}</strong>{d.brand && <span> · {d.brand}</span>}
                  <span className={`an-tag is-${d.status}`}>{d.status}</span>
                  <div className="an-draft-contact">{d.email && <a href={`mailto:${d.email}`}>{d.email}</a>}{d.whatsapp && <a href={`https://wa.me/${d.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">{d.whatsapp}</a>}</div>
                  <small>{d.interest || 'No service chosen'} · stopped at the details step · {dhaka(d.updated_at)}</small></div>
                <div className="an-draft-actions">
                  {d.status === 'open' && <button type="button" onClick={() => void setDraftStatus(d.id, 'contacted')}>Mark contacted</button>}
                  {d.status !== 'dismissed' && d.status !== 'booked' && <button type="button" onClick={() => void setDraftStatus(d.id, 'dismissed')}>Dismiss</button>}
                  <button type="button" className="is-danger" onClick={() => void setDraftStatus(d.id, 'deleted')}>Delete</button>
                </div></li>)}</ul>}
          </Panel>
        </div>

        <Panel title="Visitor journeys — where people go next"><Flows flows={report.flows} /></Panel>

        <Panel title="Pages">
          <div className="an-table-wrap"><table className="an-table"><thead><tr><th>Page</th><th>Views</th><th>Visitors</th><th>Avg. time</th><th>Scrolled</th><th>Left from here</th></tr></thead>
            <tbody>{report.pages.map(p => <tr key={p.path}><td><strong>{pageName(p.path)}</strong><small>{p.path}</small></td><td>{p.views}</td><td>{p.visitors}</td><td>{formatDuration(p.views ? p.secs / p.views : 0)}</td><td>{p.scroll === null ? '—' : `${p.scroll}%`}</td><td>{percent(p.exits, p.views)}%</td></tr>)}</tbody></table></div>
        </Panel>

        <div className="an-grid2">
          <Panel title="Most clicked"><Bars rows={report.clicks.map(c => ({ label: c.label, sub: pageName(c.path), n: c.n }))} /></Panel>
          <Panel title="Where visitors come from"><Bars rows={report.sources.map(s => ({ label: s.source, n: s.n }))} /></Panel>
        </div>
        <div className="an-grid3">
          <Panel title="Devices"><Bars rows={Object.entries(report.devices).map(([label, n]) => ({ label, n }))} /></Panel>
          <Panel title="Browsers"><Bars rows={Object.entries(report.browsers).map(([label, n]) => ({ label, n }))} /></Panel>
          <Panel title="Visitor time zones (approx. location)"><Bars rows={report.zones.map(z => ({ label: z.tz, n: z.n }))} /></Panel>
        </div>
        <Panel title="Most viewed portfolio videos"><Bars rows={report.videos.map(v => ({ label: v.title, n: v.n }))} /></Panel>

        <Panel title="Recent visits">
          <div className="an-table-wrap"><table className="an-table"><thead><tr><th>Started</th><th>Arrived on</th><th>From</th><th>Device</th><th>Pages</th><th>Time</th><th>Booked</th></tr></thead>
            <tbody>{report.sessions.map(s => <tr key={s.id} className={`an-click ${openSession === s.id ? 'is-open' : ''}`} onClick={() => setOpenSession(openSession === s.id ? null : s.id)}>
              <td>{dhaka(s.started)}</td><td>{pageName(s.entry)}</td><td>{s.source}</td><td>{s.device ?? '—'}</td><td>{s.pages}</td><td>{formatDuration(s.secs)}</td><td>{s.booked ? 'Yes' : '—'}</td></tr>)}</tbody></table></div>
          {openSession && <Timeline rows={timeline} />}
        </Panel>
      </>}
    </div>
  );
}

function Card({ label, value, note }: { label: string; value: number | string; note?: string }) {
  return <div className="an-card"><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>;
}
function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="an-panel"><div className="an-panel-head"><h2>{title}</h2>{action}</div>{children}</section>;
}
function Bars({ rows }: { rows: { label: string; sub?: string; n: number }[] }) {
  if (!rows.length) return <p className="an-empty">Nothing yet.</p>;
  const max = Math.max(...rows.map(r => r.n), 1);
  return <ul className="an-bars">{rows.slice(0, 12).map((r, i) => <li key={`${r.label}-${r.sub ?? ''}-${i}`}><div className="an-bar-label"><span>{r.label}{r.sub && <small> · {r.sub}</small>}</span><b>{r.n}</b></div><div className="an-bar"><i style={{ width: `${(r.n / max) * 100}%` }} /></div></li>)}</ul>;
}

function LineChart({ daily }: { daily: Report['daily'] }) {
  if (!daily.length) return <p className="an-empty">No visits yet in this period.</p>;
  const W = 800, H = 200, P = 28;
  const max = Math.max(...daily.map(d => d.pageviews), 1);
  const x = (i: number) => P + (daily.length === 1 ? (W - 2 * P) / 2 : (i * (W - 2 * P)) / (daily.length - 1));
  const y = (v: number) => H - P - (v / max) * (H - 2 * P);
  const line = (key: 'pageviews' | 'sessions') => daily.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d[key])}`).join(' ');
  return <div className="an-chart"><svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Page views and visits per day">
    <line x1={P} x2={W - P} y1={H - P} y2={H - P} className="an-axis" />
    <path d={line('pageviews')} className="an-line-a" /><path d={line('sessions')} className="an-line-b" />
    {daily.map((d, i) => <g key={d.day}><circle cx={x(i)} cy={y(d.pageviews)} r={3} className="an-pt-a"><title>{`${d.day}: ${d.pageviews} views, ${d.sessions} visits`}</title></circle>
      {(daily.length <= 10 || i % Math.ceil(daily.length / 8) === 0) && <text x={x(i)} y={H - 8} textAnchor="middle" className="an-tick">{d.day.slice(5)}</text>}</g>)}
    <text x={P} y={14} className="an-tick">max {max}</text>
  </svg><div className="an-legend"><span className="a" />Page views <span className="b" />Visits</div></div>;
}

function Funnel({ f }: { f: Report['funnel'] }) {
  const steps = [['Clicked a “Book” button', f.book_click], ['Opened the booking page', f.book_open], ['Chose a service', f.step1], ['Chose a date', f.step2], ['Chose a time', f.step3], ['Typed their details', f.details], ['Booked the call', f.booked]] as const;
  const max = Math.max(...steps.map(s => s[1]), 1);
  return <ol className="an-funnel">{steps.map(([label, n], i) => {
    const prev = i > 0 ? steps[i - 1]![1] : 0;
    return <li key={label}><div className="an-bar-label"><span>{label}</span><b>{n}</b></div><div className="an-bar"><i style={{ width: `${(n / max) * 100}%` }} /></div>{i > 0 && prev > n && <small>{prev - n} dropped here</small>}</li>;
  })}</ol>;
}

/** Simple two-column flow diagram (Sankey) of the most common page-to-page moves. */
function Flows({ flows }: { flows: Report['flows'] }) {
  const top = useMemo(() => flows.slice(0, 16), [flows]);
  if (!top.length) return <p className="an-empty">No journeys yet.</p>;
  const left = [...new Set(top.map(f => f.from))], right = [...new Set(top.map(f => f.to))];
  const sum = (key: 'from' | 'to', name: string) => top.filter(f => f[key] === name).reduce((s, f) => s + f.n, 0);
  const total = top.reduce((s, f) => s + f.n, 0);
  const H = Math.max(260, Math.max(left.length, right.length) * 34), W = 800, gap = 6, nodeW = 12;
  const layout = (names: string[], key: 'from' | 'to') => {
    const usable = H - gap * (names.length - 1); let yy = 0; const pos: Record<string, { y: number; h: number; off: number }> = {};
    for (const n of names) { const h = Math.max(4, (sum(key, n) / total) * usable); pos[n] = { y: yy, h, off: 0 }; yy += h + gap; }
    return pos;
  };
  const L = layout(left, 'from'), R = layout(right, 'to');
  const lx = 170, rx = W - 170;
  return <div className="an-chart"><svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Visitor journeys between pages">
    {top.map((f, i) => {
      const a = L[f.from]!, b = R[f.to]!; const h = Math.max(1.5, (f.n / sum('from', f.from)) * a.h);
      const y1 = a.y + a.off + h / 2, y2 = b.y + b.off + Math.max(1.5, (f.n / sum('to', f.to)) * b.h) / 2;
      a.off += h; b.off += Math.max(1.5, (f.n / sum('to', f.to)) * b.h);
      return <path key={i} d={`M${lx + nodeW},${y1} C${W / 2},${y1} ${W / 2},${y2} ${rx},${y2}`} className="an-flow" strokeWidth={h}><title>{`${pageName(f.from)} → ${pageName(f.to)}: ${f.n}`}</title></path>;
    })}
    {left.map(n => <g key={`l${n}`}><rect x={lx} y={L[n]!.y} width={nodeW} height={L[n]!.h} className="an-node" /><text x={lx - 8} y={L[n]!.y + L[n]!.h / 2 + 4} textAnchor="end" className="an-node-label">{pageName(n)} ({sum('from', n)})</text></g>)}
    {right.map(n => <g key={`r${n}`}><rect x={rx} y={R[n]!.y} width={nodeW} height={R[n]!.h} className="an-node" /><text x={rx + nodeW + 8} y={R[n]!.y + R[n]!.h / 2 + 4} className="an-node-label">{pageName(n)} ({sum('to', n)})</text></g>)}
  </svg></div>;
}

function Timeline({ rows }: { rows: TimelineRow[] }) {
  const steps = rows.filter(r => r.kind !== 'heartbeat');
  const time: Record<string, number> = {};
  for (const r of rows) if (r.kind === 'heartbeat') time[r.path] = (time[r.path] ?? 0) + (r.value ?? 0);
  const stepName = ['', '', 'Chose a service', 'Chose a date', 'Chose a time', 'Booked the call'];
  return <ol className="an-timeline">{steps.map((r, i) => <li key={i}><time>{dhaka(r.created_at)}</time>
    {r.kind === 'page_view' ? <span>Opened <strong>{pageName(r.path)}</strong> <small>({formatDuration(time[r.path] ?? 0)} on this page)</small></span>
      : r.kind === 'click' ? <span>Clicked “{r.label}”</span>
      : r.kind === 'scroll' ? <span>Scrolled {r.value}% of {pageName(r.path)}</span>
      : r.kind === 'booking_step' ? <span>Booking: {stepName[r.value ?? 0] ?? `step ${r.value}`}</span> : <span>{r.kind}</span>}</li>)}</ol>;
}
