import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, ExternalLink, Pencil, Plus } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { reorderSiteContent, saveSitePlan } from '@/lib/site-content.functions';
import { moveItem, planValuesSchema, type PlanValues } from '@/lib/site-content-rules';
import { emptyPlanValues, isDirty, planPriceLine, planValuesFromRow, slugify } from '@/lib/site-content-editor';
import { planInclusions } from '@/data/plans';
import { rowToPlan, type PlanRow } from '@/lib/site-content';
import { Empty, fmtDate } from '../ui';
import { Field, ListEditor, Toggle, UnsavedGuard } from './fields';
import { previewRate } from './preview-rate';
import { useRefreshSiteContent, type AdminData } from './SiteContent';

function PlanPreview({ values }: { values: PlanValues }) {
  const plan = rowToPlan({ ...values, id: 'preview', base_currency: 'USD', billing_period: 'month', sort_order: 0, created_at: '', updated_at: '' } as PlanRow);
  const valid = Number.isFinite(values.price_min) && Number.isFinite(values.price_max) && values.price_max >= values.price_min;
  return <article className={`sc-plan-card ${values.is_highlighted ? 'is-highlighted' : ''}`} aria-label="Plan preview">
    <div className="sc-plan-top"><strong>{values.name || 'Plan name'}</strong>{values.badge && <span className="sc-plan-badge">{values.badge}</span>}</div>
    <p className="admin-hint">{values.tagline}</p>
    <p className="sc-plan-price">{valid ? planPriceLine(values.price_min, values.price_max) : 'Set a price range'}</p>
    {valid && <p className="sc-price-converted">In taka: {planPriceLine(values.price_min, values.price_max, 'BDT', previewRate())}</p>}
    <ul>{planInclusions(plan).map((line, i) => <li key={i}>{line}</li>)}</ul>
    <span className="sc-plan-cta">{values.cta_text || 'Button text'}</span>
  </article>;
}

function PlanEditor({ row, onClose, onCreated }: { row: PlanRow | null; onClose: () => void; onCreated: (id: string) => void }) {
  const initial = useMemo(() => row ? planValuesFromRow(row) : emptyPlanValues(), [row]);
  const [saved, setSaved] = useState(initial);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const save = useServerFn(saveSitePlan);
  const refresh = useRefreshSiteContent();
  const dirty = isDirty(values, saved);
  const set = <K extends keyof PlanValues>(key: K, value: PlanValues[K]) => { setValues(v => ({ ...v, [key]: value })); setErrors(e => ({ ...e, [key]: undefined })); };
  const num = (key: 'price_min' | 'price_max' | 'videos' | 'statics' | 'revision_rounds' | 'turnaround_days', label: string) =>
    <Field label={label} error={errors[key]}><input type="number" inputMode="numeric" min={0} value={Number.isFinite(values[key]) ? values[key] : ''} onChange={e => set(key, e.target.value === '' ? Number.NaN : Number(e.target.value))} /></Field>;

  const submit = async () => {
    const parsed = planValuesSchema.safeParse(values);
    if (!parsed.success) { const next: Record<string, string> = {}; for (const i of parsed.error.issues) next[String(i.path[0] ?? 'form')] ??= i.message; setErrors(next); setServerError('Check the highlighted fields.'); return; }
    setBusy(true); setServerError(null);
    try { const result = await save({ data: { id: row?.id ?? null, values: parsed.data } }); const fresh = planValuesFromRow(result); setSaved(fresh); setValues(fresh); toast.success('Saved'); await refresh(); if (!row) onCreated(result.id); }
    catch (e) { setServerError(e instanceof Error ? e.message : 'This change could not be saved.'); }
    finally { setBusy(false); }
  };

  return <form className="sc-editor" onSubmit={e => { e.preventDefault(); void submit(); }}>
    <UnsavedGuard dirty={dirty && !busy} />
    <button type="button" className="admin-btn-ghost booking-page-back" onClick={onClose}><ArrowLeft size={16} />Back to plans</button>
    <header className="admin-head sc-editor-head">
      <div><p className="admin-eyebrow">{row ? `Last updated ${fmtDate(row.updated_at)}` : 'New plan'}</p><h1>{values.name || 'Untitled plan'}</h1></div>
      <div className="sc-actions"><a className="admin-btn-ghost" href="/pricing" target="_blank" rel="noopener noreferrer"><ExternalLink size={15} />View pricing</a><button type="submit" className="admin-btn" disabled={busy || !dirty}>{busy ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}</button></div>
    </header>
    {serverError && <p className="work-field-error sc-server-error" role="alert">{serverError}</p>}
    <div className="sc-editor-grid">
      <div className="sc-editor-main">
        <fieldset className="admin-form work-form"><legend className="admin-label">Plan</legend>
          <div className="admin-form-row">
            <Field label="Name" error={errors['name']}><input value={values.name} onChange={e => { const name = e.target.value; setValues(v => ({ ...v, name, slug: row ? v.slug : slugify(name) })); }} /></Field>
            <Field label="URL slug" error={errors['slug']}><input value={values.slug} onChange={e => set('slug', e.target.value)} /></Field>
          </div>
          <Field label="Who it is for" error={errors['tagline']}><input value={values.tagline} onChange={e => set('tagline', e.target.value)} /></Field>
          <div className="admin-form-row"><Field label="Badge" hint="For example Most picked. Leave empty for none."><input value={values.badge} onChange={e => set('badge', e.target.value)} /></Field>
          <Field label="Button text" error={errors['cta_text']}><input value={values.cta_text} onChange={e => set('cta_text', e.target.value)} /></Field></div>
          <Toggle label="Highlight this plan" checked={values.is_highlighted} onChange={v => set('is_highlighted', v)} />
          <Toggle label="Published on the site" checked={values.is_published} onChange={v => set('is_published', v)} />
        </fieldset>
        <fieldset className="admin-form work-form"><legend className="admin-label">Monthly price (USD)</legend>
          <div className="admin-form-row">{num('price_min', 'Lowest')}{num('price_max', 'Highest')}</div>
        </fieldset>
        <fieldset className="admin-form work-form"><legend className="admin-label">What is included each month</legend>
          <div className="admin-form-row">{num('videos', 'Videos')}{num('statics', 'Static designs')}</div>
          <div className="admin-form-row">{num('revision_rounds', 'Revision rounds')}{num('turnaround_days', 'First cut in (days)')}</div>
          <Field label="Turnaround line"><input value={values.turnaround} onChange={e => set('turnaround', e.target.value)} /></Field>
          <Field label="Calls"><input value={values.calls} onChange={e => set('calls', e.target.value)} /></Field>
          <ListEditor label="Feature lines" hint="Leave empty to use the standard list built from the numbers above." items={values.features} onChange={v => set('features', v)} error={errors['features']} />
        </fieldset>
      </div>
      <aside className="sc-editor-side"><span className="admin-label">Preview</span><PlanPreview values={values} /></aside>
    </div>
  </form>;
}

export function PlansTab({ data, item, openItem }: { data: AdminData; item: string | null; openItem: (item: string | null) => void }) {
  const reorder = useServerFn(reorderSiteContent);
  const refresh = useRefreshSiteContent();
  const move = async (from: number, to: number) => {
    try { await reorder({ data: { kind: 'plans', ids: moveItem(data.plans, from, to).map(p => p.id) } }); toast.success('Order saved'); await refresh(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'The new order could not be saved.'); }
  };
  if (item) {
    const row = item === 'new' ? null : data.plans.find(p => p.id === item) ?? undefined;
    if (row === undefined) return <Empty title="Plan not found" hint="It may have been removed." />;
    return <PlanEditor key={item} row={row} onClose={() => openItem(null)} onCreated={id => openItem(id)} />;
  }
  return <>
    <div className="work-toolbar sc-toolbar"><p className="admin-hint">Plans show on /pricing and the Home page in this order.</p><button type="button" className="admin-btn" onClick={() => openItem('new')}><Plus size={15} />New plan</button></div>
    <div className="sc-plans">
      {data.plans.map((p, i) => <div key={p.id} className="sc-plan-item">
        <PlanPreview values={planValuesFromRow(p)} />
        <div className="sc-plan-meta">
          <span className={`admin-pill ${p.is_published ? 'is-confirmed' : 'is-cancelled'}`}>{p.is_published ? 'Published' : 'Hidden'}</span>
          <small className="admin-hint">Updated {fmtDate(p.updated_at)}</small>
        </div>
        <div className="sc-actions">
          <button type="button" className="admin-icon-btn" aria-label={`Move ${p.name} left`} disabled={i === 0} onClick={() => void move(i, i - 1)}><ArrowLeft size={14} /></button>
          <button type="button" className="admin-icon-btn" aria-label={`Move ${p.name} right`} disabled={i === data.plans.length - 1} onClick={() => void move(i, i + 1)}><ArrowRight size={14} /></button>
          <button type="button" className="admin-btn-ghost" onClick={() => openItem(p.id)}><Pencil size={14} />Edit {p.name}</button>
        </div>
      </div>)}
    </div>
  </>;
}
