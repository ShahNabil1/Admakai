import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Copy, Pencil, Plus, Power, Square, TriangleAlert } from 'lucide-react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { canEditSiteContent } from '@/lib/site-content.functions';
import { duplicateOffer, endOfferNow, readOffersAdmin, setOfferActive } from '@/lib/offers.functions';
import { liveOffersQueryKey } from '@/lib/offers-query';
import { OFFER_PRESETS, offerStatus, overlapWarnings, PRESETS, type OfferPreset, type OfferStatus } from '@/lib/offer-rules';
import { Empty, useConfirm } from '../ui';
import { OfferEditor } from './OfferEditor';
import { adminOfferToOverlap, type OfferRow } from './offer-admin-data';
import '../work-admin.css';
import '../site-content/site-content.css';
import './offers-admin.css';

export const offersAdminKey = ['offers-admin'] as const;
const STATUS: Record<OfferStatus, { label: string; cls: string }> = {
  live: { label: 'Live', cls: 'is-confirmed' }, scheduled: { label: 'Scheduled', cls: 'is-in_review' }, ended: { label: 'Ended', cls: 'is-completed' }, off: { label: 'Off', cls: 'is-cancelled' },
};
const dhaka = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
const scopeLabel = (o: OfferRow) => o.applies_to === 'everything' ? 'Everything' : o.applies_to === 'services' ? 'All services' : o.applies_to === 'plans' ? 'All plans' : `${o.selected_service_ids.length} services, ${o.selected_plan_ids.length} plans`;
const presetLabel = (p: string) => (OFFER_PRESETS as readonly string[]).includes(p) ? PRESETS[p as OfferPreset].label : p;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function OffersAdmin() {
  const search = useSearch({ strict: false }) as { item?: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const check = useServerFn(canEditSiteContent);
  const read = useServerFn(readOffersAdmin);
  const toggle = useServerFn(setOfferActive);
  const end = useServerFn(endOfferNow);
  const duplicate = useServerFn(duplicateOffer);
  const { confirm, node } = useConfirm();
  const access = useQuery({ queryKey: ['site-content-access'], queryFn: () => check(), staleTime: 60_000 });
  const data = useQuery({ queryKey: offersAdminKey, queryFn: () => read(), enabled: access.data === true });
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), 30_000); return () => window.clearInterval(t); }, []);
  const openItem = (item: string | null) => void navigate({ to: '/admin/offers', search: item ? { item } : {} });
  const refresh = () => Promise.all([queryClient.invalidateQueries({ queryKey: offersAdminKey }), queryClient.invalidateQueries({ queryKey: liveOffersQueryKey })]);
  const run = async (action: () => Promise<unknown>, done: string) => {
    try { await action(); toast.success(done); await refresh(); return true; }
    catch (e) { toast.error(e instanceof Error ? e.message : 'This change could not be saved.'); return false; }
  };

  if (access.isPending) return <div className="admin-skeleton" />;
  if (access.data !== true) return <Empty title="You do not have access" hint="Only owners and hiring admins can manage offers." />;
  if (data.isPending) return <div className="admin-skeleton" />;
  if (data.error || !data.data) return <Empty title="Offers could not load" hint="Please refresh the page." />;
  const d = data.data;

  if (search.item) {
    const row = search.item === 'new' ? null : d.offers.find(o => o.id === search.item);
    if (row === undefined) return <Empty title="Offer not found" hint="It may have been removed." />;
    return <OfferEditor key={search.item} row={row} data={d} onClose={() => openItem(null)} onSaved={async id => { await refresh(); if (!row) openItem(id); }} />;
  }

  const counts = new Map(d.counts.map(c => [c.offer_id, c]));
  const warnings = overlapWarnings(d.offers.map(o => adminOfferToOverlap(o)), now);
  return <section className="sc-page of-page">
    <header className="admin-head"><div><p className="admin-eyebrow">Public website</p><h1>Offers</h1></div>
      <button type="button" className="admin-btn" onClick={() => openItem('new')}><Plus size={15} />New offer</button></header>
    <nav className="admin-chips sc-tabs" aria-label="Site content sections">
      <Link to="/admin/site-content">Services</Link><Link to="/admin/site-content/plans">Plans</Link><Link to="/admin/offers" className="is-active" aria-current="page">Offers</Link>
    </nav>
    <p className="admin-hint sc-note">Discounts are worked out on top of the saved prices, which never change. When offers cover the same item the highest priority wins; offers never stack.</p>
    {warnings.map(w => <p key={`${w.a}-${w.b}`} className="of-warning" role="status"><TriangleAlert size={15} aria-hidden="true" />{w.text}</p>)}
    {d.offers.length === 0 ? <Empty title="No offers yet" hint="Create one with a preset, such as Black Friday or Eid." /> :
      <div className="work-table sc-table" role="table" aria-label="Offers">
        <div className="of-row is-head" role="row"><span>Name</span><span>Preset</span><span>Discount</span><span>Applies to</span><span>Dates (Dhaka)</span><span>Status</span><span>Priority</span><span>Came in</span><span /></div>
        {d.offers.map(o => {
          const status = offerStatus({ isActive: o.is_active, startsAt: o.starts_at, endsAt: o.ends_at }, now);
          const c = counts.get(o.id);
          return <div key={o.id} role="row" className="of-row">
            <button type="button" className="sc-name" onClick={() => openItem(o.id)}><strong>{o.name}</strong><small>{o.short_badge}</small></button>
            <span data-label="Preset">{presetLabel(o.preset)}</span>
            <span data-label="Discount"><b>{o.discount_percent}%</b></span>
            <span data-label="Applies to">{scopeLabel(o)}</span>
            <span data-label="Dates" className="of-dates">{dhaka.format(new Date(o.starts_at))}<small>{o.ends_at ? `to ${dhaka.format(new Date(o.ends_at))}` : 'Until turned off'}</small></span>
            <span data-label="Status"><span className={`admin-pill ${STATUS[status].cls}`}>{STATUS[status].label}</span></span>
            <span data-label="Priority">{o.priority}</span>
            <span data-label="Came in">{plural(Number(c?.bookings ?? 0), 'booking')}<small>{plural(Number(c?.enquiries ?? 0), 'enquiry').replace('enquirys', 'enquiries')}</small></span>
            <span className="sc-row-actions">
              <button type="button" className="admin-icon-btn" aria-label={`Edit ${o.name}`} title="Edit" onClick={() => openItem(o.id)}><Pencil size={14} /></button>
              <button type="button" className="admin-icon-btn" aria-label={`Duplicate ${o.name}`} title="Duplicate" onClick={() => void run(() => duplicate({ data: { id: o.id } }), 'Copy created, switched off')}><Copy size={14} /></button>
              {status !== 'ended' && <button type="button" className="admin-icon-btn" aria-label={o.is_active ? `Turn off ${o.name}` : `Turn on ${o.name}`} title={o.is_active ? 'Turn off' : 'Turn on'} onClick={() => void run(() => toggle({ data: { id: o.id, active: !o.is_active } }), o.is_active ? 'Offer turned off' : 'Offer turned on')}><Power size={14} /></button>}
              {status === 'live' && <button type="button" className="admin-icon-btn is-danger" aria-label={`End ${o.name} now`} title="End now" onClick={() => confirm({ title: `End ${o.name} now?`, description: 'Prices go back to normal on the site straight away. The offer stays in this list as Ended and can be duplicated later.', confirmLabel: 'End now', danger: true, run: () => run(() => end({ data: { id: o.id } }), 'Offer ended') })}><Square size={14} /></button>}
            </span>
          </div>;
        })}
      </div>}
    {node}
  </section>;
}
