import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { ArrowDown, ArrowLeft, ArrowUp, Bold, ExternalLink, Italic, List, Plus, Trash2 } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { saveSiteService } from '@/lib/site-content.functions';
import { moveItem, PRICING_MODELS, serviceValuesSchema, type ServiceValues } from '@/lib/site-content-rules';
import { emptyServiceValues, isDirty, servicePriceLine, serviceValuesFromRow, slugify } from '@/lib/site-content-editor';
import type { ServiceRow } from '@/lib/site-content';
import { fmtDate } from '../ui';
import { Field, ListEditor, Toggle, UnsavedGuard } from './fields';
import { previewRate } from './preview-rate';
import { useRefreshSiteContent, type AdminData } from './SiteContent';

type Errors = Partial<Record<string, string>>;
const MODEL_LABELS: Record<(typeof PRICING_MODELS)[number], string> = { quote: 'Project quote', 'per-minute': 'Priced per minute', monthly: 'Monthly' };

function RichText({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);
  const wrap = (before: string, after = before) => {
    const el = ref.current; if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const next = value.slice(0, a) + before + (value.slice(a, b) || 'text') + after + value.slice(b);
    onChange(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + before.length, a + before.length + (b - a || 4)); });
  };
  const bullet = () => {
    const el = ref.current; if (!el) return;
    const start = value.lastIndexOf('\n', el.selectionStart - 1) + 1;
    onChange(`${value.slice(0, start)}- ${value.slice(start)}`);
  };
  return <div className="sc-rich">
    <div className="sc-rich-bar" role="toolbar" aria-label="Formatting">
      <button type="button" className="admin-icon-btn" aria-label="Bold" disabled={preview} onClick={() => wrap('**')}><Bold size={14} /></button>
      <button type="button" className="admin-icon-btn" aria-label="Italic" disabled={preview} onClick={() => wrap('*')}><Italic size={14} /></button>
      <button type="button" className="admin-icon-btn" aria-label="Bullet list" disabled={preview} onClick={bullet}><List size={14} /></button>
      <button type="button" className="admin-btn-ghost sc-rich-toggle" aria-pressed={preview} onClick={() => setPreview(p => !p)}>{preview ? 'Edit' : 'Preview'}</button>
    </div>
    {preview ? <div className="sc-rich-preview">{value.trim() ? <ReactMarkdown skipHtml>{value}</ReactMarkdown> : <p className="admin-hint">Nothing to preview yet.</p>}</div>
      : <textarea ref={ref} rows={6} value={value} onChange={e => onChange(e.target.value)} aria-label="Full description" />}
    <span className="admin-hint">Use a blank line for a new paragraph. **Bold**, *italic* and lines starting with "- " for bullets.</span>
  </div>;
}

export function ServiceEditor({ row, data, onClose, onCreated }: { row: ServiceRow | null; data: AdminData; onClose: () => void; onCreated: (id: string) => void }) {
  const initial = useMemo(() => row ? serviceValuesFromRow(row) : emptyServiceValues(data.categories[0]?.slug ?? ''), [row, data.categories]);
  const [saved, setSaved] = useState<ServiceValues>(initial);
  const [values, setValues] = useState<ServiceValues>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const save = useServerFn(saveSiteService);
  const refresh = useRefreshSiteContent();
  const dirty = isDirty(values, saved);
  const set = <K extends keyof ServiceValues>(key: K, value: ServiceValues[K]) => { setValues(v => ({ ...v, [key]: value })); setErrors(e => ({ ...e, [key]: undefined })); };
  const rate = previewRate();
  const others = data.services.filter(s => s.id !== row?.id);

  const submit = async () => {
    const parsed = serviceValuesSchema.safeParse(values);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) { const k = String(issue.path[0] ?? 'form'); next[k] ??= issue.message; }
      setErrors(next); setServerError('Check the highlighted fields.'); return;
    }
    setBusy(true); setServerError(null);
    try {
      const result = await save({ data: { id: row?.id ?? null, values: parsed.data } });
      const fresh = serviceValuesFromRow(result);
      setSaved(fresh); setValues(fresh);
      toast.success('Saved');
      await refresh();
      if (!row) onCreated(result.id);
    } catch (e) { setServerError(e instanceof Error ? e.message : 'This change could not be saved.'); }
    finally { setBusy(false); }
  };

  return <form className="sc-editor" onSubmit={e => { e.preventDefault(); void submit(); }}>
    <UnsavedGuard dirty={dirty && !busy} />
    <button type="button" className="admin-btn-ghost booking-page-back" onClick={onClose}><ArrowLeft size={16} />Back to services</button>
    <header className="admin-head sc-editor-head">
      <div><p className="admin-eyebrow">{row ? `Last updated ${fmtDate(row.updated_at)}` : 'New service'}</p><h1>{values.name || 'Untitled service'}</h1></div>
      <div className="sc-actions">
        {row && <a className="admin-btn-ghost" href={`/services/${saved.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} />View on site</a>}
        <button type="submit" className="admin-btn" disabled={busy || !dirty}>{busy ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}</button>
      </div>
    </header>
    {row && !saved.is_published && <p className="admin-hint sc-note">This service is hidden. Its page sends visitors to /services until you publish it.</p>}
    {serverError && <p className="work-field-error sc-server-error" role="alert">{serverError}</p>}

    <div className="sc-editor-grid">
      <div className="sc-editor-main">
        <fieldset className="admin-form work-form"><legend className="admin-label">Basics</legend>
          <Field label="Name" error={errors['name']}><input value={values.name} onChange={e => { const name = e.target.value; setValues(v => ({ ...v, name, slug: row || (v.slug && v.slug !== slugify(v.name)) ? v.slug : slugify(name) })); }} /></Field>
          <div className="admin-form-row">
            <Field label="URL slug" hint={row ? 'Changing it changes the page address.' : undefined} error={errors['slug']}><input value={values.slug} onChange={e => set('slug', e.target.value)} /></Field>
            <Field label="Category" error={errors['category']}><select value={values.category} onChange={e => set('category', e.target.value)}>{data.categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}</select></Field>
          </div>
          <Field label="Short description" hint="Shown on service cards and as the default search description." counter={{ value: values.short_description.length, max: 600 }} error={errors['short_description']}><textarea rows={2} value={values.short_description} onChange={e => set('short_description', e.target.value)} /></Field>
          <div className="sc-field"><span className="sc-field-label">Full description<small className={values.full_description.length > 8000 ? 'is-over' : ''}>{values.full_description.length}/8000</small></span><RichText value={values.full_description} onChange={v => set('full_description', v)} />{errors['full_description'] && <span className="work-field-error">{errors['full_description']}</span>}</div>
        </fieldset>

        <fieldset className="admin-form work-form"><legend className="admin-label">Page headline</legend>
          <div className="admin-form-row sc-three">
            <Field label="Lead"><input value={values.hero_title.lead} onChange={e => set('hero_title', { ...values.hero_title, lead: e.target.value })} /></Field>
            <Field label="Highlighted words"><input value={values.hero_title.accent} onChange={e => set('hero_title', { ...values.hero_title, accent: e.target.value })} /></Field>
            <Field label="Rest"><input value={values.hero_title.rest} onChange={e => set('hero_title', { ...values.hero_title, rest: e.target.value })} /></Field>
          </div>
          <p className="sc-hero-preview" aria-label="Headline preview">{values.hero_title.lead} <em>{values.hero_title.accent}</em> {values.hero_title.rest}</p>
        </fieldset>

        <fieldset className="admin-form work-form"><legend className="admin-label">What is included</legend>
          <ListEditor label="What you get" items={values.deliverables} onChange={v => set('deliverables', v)} error={errors['deliverables']} />
          <ListEditor label="Best for" items={values.best_for} onChange={v => set('best_for', v)} />
          <ListEditor label="Signs you need it" hint="The first three show on the service page." items={values.signs_you_need_it} onChange={v => set('signs_you_need_it', v)} />
          <ListEditor label="What we need from you" items={values.what_we_need} onChange={v => set('what_we_need', v)} />
          <div className="admin-form-row">
            <Field label="Formats" hint="For example 16:9, 9:16, 1:1"><input value={values.formats} onChange={e => set('formats', e.target.value)} /></Field>
            <Field label="Delivery" hint="For example 7 days"><input value={values.delivery} onChange={e => set('delivery', e.target.value)} /></Field>
          </div>
          <Field label="Compare note" hint="Optional line that explains how this differs from a similar service."><textarea rows={2} value={values.compare_note ?? ''} onChange={e => set('compare_note', e.target.value)} /></Field>
        </fieldset>

        <fieldset className="admin-form work-form"><legend className="admin-label">Process steps</legend>
          <p className="admin-hint">Leave empty to use the standard seven-step process.</p>
          {values.process_steps.map((step, i) => <div key={i} className="sc-step">
            <div className="sc-step-head"><strong>Step {i + 1}</strong><span className="sc-actions">
              <button type="button" className="admin-icon-btn" aria-label="Move step up" disabled={i === 0} onClick={() => set('process_steps', moveItem(values.process_steps, i, i - 1))}><ArrowUp size={14} /></button>
              <button type="button" className="admin-icon-btn" aria-label="Move step down" disabled={i === values.process_steps.length - 1} onClick={() => set('process_steps', moveItem(values.process_steps, i, i + 1))}><ArrowDown size={14} /></button>
              <button type="button" className="admin-icon-btn is-danger" aria-label="Remove step" onClick={() => set('process_steps', values.process_steps.filter((_, j) => j !== i))}><Trash2 size={14} /></button></span></div>
            <div className="admin-form-row"><Field label="Name"><input value={step.name} onChange={e => set('process_steps', values.process_steps.map((s, j) => j === i ? { ...s, name: e.target.value } : s))} /></Field>
            <Field label="One line"><input value={step.line} onChange={e => set('process_steps', values.process_steps.map((s, j) => j === i ? { ...s, line: e.target.value } : s))} /></Field></div>
            <ListEditor label="Chips" items={step.chips} onChange={chips => set('process_steps', values.process_steps.map((s, j) => j === i ? { ...s, chips } : s))} />
          </div>)}
          {errors['process_steps'] && <span className="work-field-error">{errors['process_steps']}</span>}
          <button type="button" className="admin-btn-ghost sc-add" onClick={() => set('process_steps', [...values.process_steps, { name: '', line: '', chips: [] }])}><Plus size={14} />Add step</button>
        </fieldset>

        <fieldset className="admin-form work-form"><legend className="admin-label">FAQs</legend>
          <p className="admin-hint">Leave empty for no FAQ section on this service page.</p>
          {values.faqs.map((faq, i) => <div key={i} className="sc-step">
            <div className="sc-step-head"><strong>Question {i + 1}</strong><span className="sc-actions">
              <button type="button" className="admin-icon-btn" aria-label="Move question up" disabled={i === 0} onClick={() => set('faqs', moveItem(values.faqs, i, i - 1))}><ArrowUp size={14} /></button>
              <button type="button" className="admin-icon-btn" aria-label="Move question down" disabled={i === values.faqs.length - 1} onClick={() => set('faqs', moveItem(values.faqs, i, i + 1))}><ArrowDown size={14} /></button>
              <button type="button" className="admin-icon-btn is-danger" aria-label="Remove question" onClick={() => set('faqs', values.faqs.filter((_, j) => j !== i))}><Trash2 size={14} /></button></span></div>
            <Field label="Question"><input value={faq.question} onChange={e => set('faqs', values.faqs.map((f, j) => j === i ? { ...f, question: e.target.value } : f))} /></Field>
            <Field label="Answer"><textarea rows={3} value={faq.answer} onChange={e => set('faqs', values.faqs.map((f, j) => j === i ? { ...f, answer: e.target.value } : f))} /></Field>
          </div>)}
          {errors['faqs'] && <span className="work-field-error">{errors['faqs']}</span>}
          <button type="button" className="admin-btn-ghost sc-add" onClick={() => set('faqs', [...values.faqs, { question: '', answer: '' }])}><Plus size={14} />Add question</button>
        </fieldset>

        <fieldset className="admin-form work-form"><legend className="admin-label">Search and sharing</legend>
          <Field label="SEO title" counter={{ value: (values.seo_title ?? '').length, max: 160 }} hint="Leave empty to use the name followed by | Admakai." error={errors['seo_title']}><input value={values.seo_title ?? ''} placeholder={`${values.name || 'Service name'} | Admakai`} onChange={e => set('seo_title', e.target.value)} /></Field>
          <Field label="SEO description" counter={{ value: (values.seo_description ?? '').length, max: 320 }} hint="Leave empty to use the short description." error={errors['seo_description']}><textarea rows={2} value={values.seo_description ?? ''} placeholder={values.short_description} onChange={e => set('seo_description', e.target.value)} /></Field>
        </fieldset>
      </div>

      <aside className="sc-editor-side">
        <fieldset className="admin-form work-form"><legend className="admin-label">Visibility</legend>
          <Toggle label="Published on the site" checked={values.is_published} onChange={v => set('is_published', v)} />
          <Toggle label="Featured (Popular)" checked={values.is_featured} onChange={v => set('is_featured', v)} />
          <Toggle label="Show New badge" checked={values.is_new} onChange={v => set('is_new', v)} />
        </fieldset>
        <fieldset className="admin-form work-form"><legend className="admin-label">Price (USD)</legend>
          <div className="admin-form-row">
            <Field label="Lowest" error={errors['price_min']}><input type="number" inputMode="decimal" min={0} step="1" value={Number.isFinite(values.price_min) ? values.price_min : ''} onChange={e => set('price_min', e.target.value === '' ? Number.NaN : Number(e.target.value))} /></Field>
            <Field label="Highest" error={errors['price_max']}><input type="number" inputMode="decimal" min={0} step="1" value={Number.isFinite(values.price_max) ? values.price_max : ''} onChange={e => set('price_max', e.target.value === '' ? Number.NaN : Number(e.target.value))} /></Field>
          </div>
          <div className="admin-form-row">
            <Field label="Unit" hint="project hides the unit on the site" error={errors['price_unit']}><input list="sc-units" value={values.price_unit} onChange={e => set('price_unit', e.target.value)} /></Field>
            <Field label="Pricing type"><select value={values.pricing_model} onChange={e => set('pricing_model', e.target.value as ServiceValues['pricing_model'])}>{PRICING_MODELS.map(m => <option key={m} value={m}>{MODEL_LABELS[m]}</option>)}</select></Field>
          </div>
          <datalist id="sc-units">{['project', 'product', 'pack of 20 products', 'month', 'video', 'module', 'person', 'pack of 6', 'minute', 'track'].map(u => <option key={u} value={u} />)}</datalist>
          <div className="sc-price-preview" aria-live="polite">
            <span className="admin-label">How it shows on the site</span>
            {Number.isFinite(values.price_min) && Number.isFinite(values.price_max) && values.price_max >= values.price_min ? <>
              <p>{servicePriceLine(values.price_min, values.price_max, values.price_unit)}</p>
              <p className="sc-price-converted">In Bangladeshi taka: {servicePriceLine(values.price_min, values.price_max, values.price_unit, 'BDT', rate)}</p>
              <small className="admin-hint">Visitors who pick another currency see today's converted rate.</small>
            </> : <p className="admin-hint">Enter a lowest and highest price.</p>}
          </div>
        </fieldset>
        <fieldset className="admin-form work-form"><legend className="admin-label">Related services</legend>
          <p className="admin-hint">Up to 10, shown at the bottom of the page.</p>
          <div className="sc-related">{values.related.map(slug => <span key={slug} className="work-chip">{others.find(s => s.slug === slug)?.name ?? slug}<button type="button" aria-label={`Remove ${slug}`} onClick={() => set('related', values.related.filter(s => s !== slug))}>×</button></span>)}</div>
          <select aria-label="Add a related service" value="" onChange={e => { if (e.target.value && !values.related.includes(e.target.value)) set('related', [...values.related, e.target.value]); }} disabled={values.related.length >= 10}>
            <option value="">Add a related service</option>
            {others.filter(s => !values.related.includes(s.slug)).map(s => <option key={s.id} value={s.slug}>{s.name}</option>)}
          </select>
          {errors['related'] && <span className="work-field-error">{errors['related']}</span>}
          <ListEditor label="Goals" hint="Goal filter keys on /services, for example sales or launch." items={values.goals} onChange={v => set('goals', v)} />
        </fieldset>
      </aside>
    </div>
  </form>;
}
