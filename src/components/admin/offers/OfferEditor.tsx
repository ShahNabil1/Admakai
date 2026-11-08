import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, ExternalLink, Monitor, Search, Smartphone, TriangleAlert } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { saveOffer } from '@/lib/offers.functions';
import { offerValuesSchema, type OfferValues } from '@/lib/offer-schema';
import { dhakaInputToIso, isoToDhakaInput, OFFER_PRESETS, overlapWarnings, PRESETS, type OfferPreset, type OfferScope, type PublicOffer } from '@/lib/offer-rules';
import { slugify } from '@/lib/site-content-editor';
import { OfferPreviewProvider } from '@/components/offers/OfferContext';
import { OfferBarView } from '@/components/offers/OfferBar';
import { OfferRange, PlanOfferPrice } from '@/components/offers/OfferPrice';
import { fmtDate } from '../ui';
import { Field, Toggle, UnsavedGuard } from '../site-content/fields';
import { adminOfferToOverlap, type OffersAdminData, type OfferRow } from './offer-admin-data';

type Draft = Omit<OfferValues, 'startsAt' | 'endsAt'> & { startsLocal: string; endsLocal: string; runForever: boolean };
const SCOPES: { value: OfferScope; label: string }[] = [
  { value: 'everything', label: 'Everything' }, { value: 'services', label: 'All services' }, { value: 'plans', label: 'All plans' }, { value: 'selected', label: 'Pick items' },
];

function emptyDraft(): Draft {
  const p = PRESETS.black_friday, pct = 50;
  const start = new Date(Date.now() + 6 * 3600_000); start.setUTCMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 7 * 86400_000);
  return {
    name: '', slug: '', preset: 'black_friday', headline: p.headline(pct), shortBadge: p.badge(pct), discountPercent: pct,
    appliesTo: 'everything', selectedServiceIds: [], selectedPlanIds: [], isActive: false, priority: 0, showBar: true, showCountdown: true,
    ctaText: 'Claim now', ctaLink: '/pricing', theme: { ...p.theme },
    startsLocal: start.toISOString().slice(0, 16), endsLocal: end.toISOString().slice(0, 16), runForever: false,
  };
}
function draftFromRow(r: OfferRow): Draft {
  const preset = (OFFER_PRESETS as readonly string[]).includes(r.preset) ? r.preset as OfferPreset : 'custom';
  const theme = (r.theme ?? {}) as Record<string, string>;
  return {
    name: r.name, slug: r.slug, preset, headline: r.headline, shortBadge: r.short_badge, discountPercent: r.discount_percent,
    appliesTo: r.applies_to as OfferScope, selectedServiceIds: r.selected_service_ids, selectedPlanIds: r.selected_plan_ids,
    isActive: r.is_active, priority: r.priority, showBar: r.show_bar, showCountdown: r.show_countdown, ctaText: r.cta_text, ctaLink: r.cta_link,
    theme: { ...PRESETS[preset].theme, ...theme },
    startsLocal: isoToDhakaInput(r.starts_at), endsLocal: isoToDhakaInput(r.ends_at), runForever: r.ends_at === null,
  };
}
function toValues(d: Draft) {
  const { startsLocal, endsLocal, runForever, ...rest } = d;
  return { ...rest, startsAt: dhakaInputToIso(startsLocal) ?? '', endsAt: runForever ? null : dhakaInputToIso(endsLocal) ?? '' };
}

function Preview({ draft, data, now }: { draft: Draft; data: OffersAdminData; now: number }) {
  const [mode, setMode] = useState<'desktop' | 'mobile'>('desktop');
  const values = toValues(draft);
  const slugOf = (ids: string[], list: { id: string; slug: string }[]) => ids.flatMap(id => list.find(x => x.id === id)?.slug ?? []);
  // The preview always shows the offer as live so the design can be checked before it starts.
  const offer: PublicOffer = {
    id: 'preview', slug: draft.slug || 'preview', preset: draft.preset, headline: draft.headline || 'Your headline', shortBadge: draft.shortBadge || 'Badge',
    discountPercent: draft.discountPercent, appliesTo: draft.appliesTo,
    serviceSlugs: slugOf(draft.selectedServiceIds, data.services), planSlugs: slugOf(draft.selectedPlanIds, data.plans),
    startsAt: new Date(now - 60_000).toISOString(), endsAt: values.endsAt || null, isActive: true, priority: draft.priority,
    showBar: true, showCountdown: draft.showCountdown, ctaText: draft.ctaText || 'Claim now', ctaLink: draft.ctaLink, theme: draft.theme,
  };
  const service = (draft.appliesTo === 'selected' ? data.services.find(s => draft.selectedServiceIds.includes(s.id)) : undefined) ?? data.services.find(s => s.is_published);
  const plan = (draft.appliesTo === 'selected' ? data.plans.find(p => draft.selectedPlanIds.includes(p.id)) : undefined) ?? data.plans.find(p => p.slug === 'growth') ?? data.plans[0];
  return <OfferPreviewProvider offers={[offer]} now={now}>
    <div className="of-preview">
      <div className="of-preview-head"><span className="admin-label">Live preview</span>
        <div className="admin-segment of-device" role="group" aria-label="Preview size">
          <button type="button" className={mode === 'desktop' ? 'is-active' : ''} aria-pressed={mode === 'desktop'} onClick={() => setMode('desktop')}><Monitor size={14} />Desktop</button>
          <button type="button" className={mode === 'mobile' ? 'is-active' : ''} aria-pressed={mode === 'mobile'} onClick={() => setMode('mobile')}><Smartphone size={14} />Mobile</button>
        </div>
      </div>
      <div className={`of-frame is-${mode}`}>
        {draft.showBar ? <OfferBarView offer={offer} now={now} onClose={() => {}} onCta={e => e.preventDefault()} /> : <p className="of-frame-off">The bar is hidden for this offer. Prices still change.</p>}
        <div className="of-frame-header" aria-hidden="true"><span /><span /><span /></div>
      </div>
      {service && <article className="of-sample-card"><small className="admin-label">Sample service card</small><strong>{service.name}</strong>
        <p><OfferRange kind="service" slug={service.slug} minUsd={service.price_min} maxUsd={service.price_max} prefix="Estimated price: " suffix={service.price_unit !== 'project' ? ` per ${service.price_unit}` : ''} /></p></article>}
      {plan && <article className="of-sample-card"><small className="admin-label">Sample plan card</small><strong>{plan.name}</strong>
        <PlanOfferPrice slug={plan.slug} minUsd={plan.price_min} maxUsd={plan.price_max} priceClassName="of-sample-plan-price" /></article>}
      {draft.appliesTo === 'selected' && (!service || !draft.selectedServiceIds.includes(service.id)) && <p className="admin-hint">No service picked: the sample service card shows its normal price.</p>}
    </div>
  </OfferPreviewProvider>;
}

function ItemPicker({ draft, data, onChange }: { draft: Draft; data: OffersAdminData; onChange: (s: string[], p: string[]) => void }) {
  const [q, setQ] = useState('');
  const match = (name: string) => name.toLowerCase().includes(q.trim().toLowerCase());
  const toggle = (list: string[], id: string) => list.includes(id) ? list.filter(x => x !== id) : [...list, id];
  return <div className="of-picker">
    <label className="sc-search"><Search size={15} aria-hidden="true" /><input type="search" placeholder="Search services and plans" aria-label="Search services and plans" value={q} onChange={e => setQ(e.target.value)} /></label>
    <p className="admin-hint">{draft.selectedServiceIds.length} services and {draft.selectedPlanIds.length} plans picked</p>
    <div className="of-picker-list" data-lenis-prevent>
      <span className="admin-label">Monthly plans</span>
      {data.plans.filter(p => match(p.name)).map(p => <label key={p.id} className="of-pick"><input type="checkbox" checked={draft.selectedPlanIds.includes(p.id)} onChange={() => onChange(draft.selectedServiceIds, toggle(draft.selectedPlanIds, p.id))} />{p.name}{!p.is_published && <small>Hidden</small>}</label>)}
      <span className="admin-label">Services</span>
      {data.services.filter(s => match(s.name)).map(s => <label key={s.id} className="of-pick"><input type="checkbox" checked={draft.selectedServiceIds.includes(s.id)} onChange={() => onChange(toggle(draft.selectedServiceIds, s.id), draft.selectedPlanIds)} />{s.name}{!s.is_published && <small>Hidden</small>}</label>)}
    </div>
  </div>;
}

export function OfferEditor({ row, data, onClose, onSaved }: { row: OfferRow | null; data: OffersAdminData; onClose: () => void; onSaved: (id: string) => Promise<void> }) {
  const initial = useMemo(() => row ? draftFromRow(row) : emptyDraft(), [row]);
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(t); }, []);
  const save = useServerFn(saveOffer);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => { setDraft(d => ({ ...d, [key]: value })); setErrors(e => ({ ...e, [key]: undefined })); };

  // Choosing a preset fills its theme, headline and badge; everything stays editable.
  const choosePreset = (preset: OfferPreset) => setDraft(d => ({ ...d, preset, theme: { ...PRESETS[preset].theme }, headline: PRESETS[preset].headline(d.discountPercent), shortBadge: PRESETS[preset].badge(d.discountPercent), name: d.name || `${PRESETS[preset].label} ${new Date().getFullYear()}`, slug: d.slug || slugify(`${PRESETS[preset].label} ${new Date().getFullYear()}`) }));
  // Moving the slider keeps preset wording in step until the text has been edited by hand.
  const setPercent = (pct: number) => setDraft(d => {
    const p = PRESETS[d.preset];
    return { ...d, discountPercent: pct, headline: d.headline === p.headline(d.discountPercent) ? p.headline(pct) : d.headline, shortBadge: d.shortBadge === p.badge(d.discountPercent) ? p.badge(pct) : d.shortBadge };
  });

  const others = data.offers.filter(o => o.id !== row?.id).map(o => adminOfferToOverlap(o));
  const values = toValues(draft);
  const self = adminOfferToOverlap({ id: row?.id ?? 'draft', name: draft.name || 'This offer', priority: draft.priority, starts_at: values.startsAt || new Date().toISOString(), ends_at: values.endsAt || null, is_active: true, applies_to: draft.appliesTo, selected_service_ids: draft.selectedServiceIds, selected_plan_ids: draft.selectedPlanIds });
  const warnings = overlapWarnings([self, ...others], now).filter(w => w.a === self.id || w.b === self.id);

  const submit = async () => {
    const parsed = offerValuesSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const i of parsed.error.issues) { const k = String(i.path[0] ?? 'form'); next[k === 'startsAt' ? 'startsLocal' : k === 'endsAt' ? 'endsLocal' : k] ??= i.message; }
      setErrors(next); setServerError('Check the highlighted fields.'); return;
    }
    setBusy(true); setServerError(null);
    try { const result = await save({ data: { id: row?.id ?? null, values: parsed.data } }); setSaved(draft); toast.success('Saved'); await onSaved(result.id); }
    catch (e) { setServerError(e instanceof Error ? e.message : 'This change could not be saved.'); }
    finally { setBusy(false); }
  };
  const color = (key: keyof Draft['theme'], label: string) => <label className="of-color"><input type="color" value={draft.theme[key]} onChange={e => set('theme', { ...draft.theme, [key]: e.target.value.toUpperCase() })} /><span>{label}<small>{draft.theme[key]}</small></span></label>;

  return <form className="sc-editor" onSubmit={e => { e.preventDefault(); void submit(); }}>
    <UnsavedGuard dirty={dirty && !busy} />
    <button type="button" className="admin-btn-ghost booking-page-back" onClick={onClose}><ArrowLeft size={16} />Back to offers</button>
    <header className="admin-head sc-editor-head">
      <div><p className="admin-eyebrow">{row ? `Last updated ${fmtDate(row.updated_at)}` : 'New offer'}</p><h1>{draft.name || 'Untitled offer'}</h1></div>
      <div className="sc-actions"><a className="admin-btn-ghost" href="/pricing" target="_blank" rel="noopener noreferrer"><ExternalLink size={15} />View pricing</a><button type="submit" className="admin-btn" disabled={busy || !dirty}>{busy ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}</button></div>
    </header>
    {serverError && <p className="work-field-error sc-server-error" role="alert">{serverError}</p>}
    {warnings.map(w => <p key={`${w.a}-${w.b}`} className="of-warning" role="status"><TriangleAlert size={15} aria-hidden="true" />{w.text}</p>)}
    <div className="sc-editor-grid of-editor-grid">
      <div className="sc-editor-main">
        <fieldset className="admin-form work-form"><legend className="admin-label">Preset</legend>
          <div className="of-presets">{OFFER_PRESETS.map(p => <button key={p} type="button" className={`of-preset ${draft.preset === p ? 'is-active' : ''}`} aria-pressed={draft.preset === p} onClick={() => choosePreset(p)}>
            <span className="of-swatch" style={{ background: PRESETS[p].theme.background, borderColor: PRESETS[p].theme.accent }}><i style={{ background: PRESETS[p].theme.accent }} /></span>{PRESETS[p].label}</button>)}</div>
          <p className="admin-hint">A preset fills in colours, headline and badge. You can change all of them.</p>
        </fieldset>
        <fieldset className="admin-form work-form"><legend className="admin-label">Offer</legend>
          <div className="admin-form-row">
            <Field label="Internal name" hint="Only staff see this." error={errors['name']}><input value={draft.name} onChange={e => { const name = e.target.value; setDraft(d => ({ ...d, name, slug: row ? d.slug : slugify(name).slice(0, 80) })); }} /></Field>
            <Field label="Slug" error={errors['slug']}><input value={draft.slug} onChange={e => set('slug', e.target.value)} /></Field>
          </div>
          <Field label="Headline" error={errors['headline']} counter={{ value: draft.headline.length, max: 160 }}><input value={draft.headline} onChange={e => set('headline', e.target.value)} /></Field>
          <Field label="Short badge" hint="Shown above discounted prices." error={errors['shortBadge']} counter={{ value: draft.shortBadge.length, max: 40 }}><input value={draft.shortBadge} onChange={e => set('shortBadge', e.target.value)} /></Field>
          <Field label={`Discount: ${draft.discountPercent}%`} error={errors['discountPercent']}><input type="range" min={1} max={90} step={1} value={draft.discountPercent} onChange={e => setPercent(Number(e.target.value))} aria-valuetext={`${draft.discountPercent} percent`} /></Field>
        </fieldset>
        <fieldset className="admin-form work-form"><legend className="admin-label">Applies to</legend>
          <div className="admin-segment">{SCOPES.map(s => <button key={s.value} type="button" className={draft.appliesTo === s.value ? 'is-active' : ''} aria-pressed={draft.appliesTo === s.value} onClick={() => set('appliesTo', s.value)}>{s.label}</button>)}</div>
          {errors['appliesTo'] && <span className="work-field-error" role="alert">{errors['appliesTo']}</span>}
          {draft.appliesTo === 'selected' && <ItemPicker draft={draft} data={data} onChange={(s, p) => setDraft(d => ({ ...d, selectedServiceIds: s, selectedPlanIds: p }))} />}
        </fieldset>
        <fieldset className="admin-form work-form"><legend className="admin-label">Dates (Dhaka time)</legend>
          <div className="admin-form-row">
            <Field label="Starts" error={errors['startsLocal']}><input type="datetime-local" value={draft.startsLocal} onChange={e => set('startsLocal', e.target.value)} /></Field>
            {!draft.runForever && <Field label="Ends" error={errors['endsLocal']}><input type="datetime-local" value={draft.endsLocal} onChange={e => set('endsLocal', e.target.value)} /></Field>}
          </div>
          <Toggle label="Run until I turn it off" checked={draft.runForever} onChange={v => set('runForever', v)} />
          <Field label="Priority" hint="When offers cover the same item, the higher number wins. Offers never stack." error={errors['priority']}><input type="number" inputMode="numeric" min={-1000} max={1000} value={Number.isFinite(draft.priority) ? draft.priority : ''} onChange={e => set('priority', e.target.value === '' ? Number.NaN : Math.trunc(Number(e.target.value)))} /></Field>
          <Toggle label="Offer is switched on" checked={draft.isActive} onChange={v => set('isActive', v)} />
        </fieldset>
        <fieldset className="admin-form work-form"><legend className="admin-label">Offer bar</legend>
          <Toggle label="Show the bar above the header" checked={draft.showBar} onChange={v => set('showBar', v)} />
          <Toggle label="Show a countdown" checked={draft.showCountdown} onChange={v => set('showCountdown', v)} />
          <div className="admin-form-row">
            <Field label="Button text" error={errors['ctaText']}><input value={draft.ctaText} onChange={e => set('ctaText', e.target.value)} /></Field>
            <Field label="Button link" hint="A page on this site, like /pricing" error={errors['ctaLink']}><input value={draft.ctaLink} onChange={e => set('ctaLink', e.target.value)} /></Field>
          </div>
        </fieldset>
        <fieldset className="admin-form work-form"><legend className="admin-label">Colours</legend>
          <div className="of-colors">{color('background', 'Background')}{color('text', 'Text')}{color('accent', 'Accent')}{color('badge', 'Badge')}</div>
          {errors['theme'] && <span className="work-field-error" role="alert">{errors['theme']}</span>}
        </fieldset>
      </div>
      <aside className="sc-editor-side"><Preview draft={draft} data={data} now={now} /></aside>
    </div>
  </form>;
}
