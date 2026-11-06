import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowLeft, ArrowUp, Plus, X } from 'lucide-react';
import type { CaseStudy, WorkAspect, WorkCategory } from '@/types/work';
import { createWork, setWorkServices, updateWork, type WorkWithLinks } from '@/lib/works';
import { isWorkSlugTaken } from '@/lib/work-admin';
import { getVimeoMeta, parseVimeoId } from '@/lib/vimeo';
import { fieldErrors, slugify, workFormSchema, WORK_ASPECTS } from '@/lib/work-schemas';
import { serviceCategories, services } from '@/data/services';

type Props = {
  work: WorkWithLinks | null;
  categories: WorkCategory[];
  onDirtyChange: (dirty: boolean) => void;
  onSaved: () => void;
  onCancel: () => void;
};

type FormState = {
  slug: string; title: string; vimeo: string; aspect: WorkAspect;
  duration: string; thumbnail: string; category_id: string;
  client_name: string; industry: string; year: string;
  short_description: string; tags: string[];
  featured: boolean; published: boolean;
  seo_title: string; seo_description: string;
  case_study: CaseStudy;
  links: { service_slug: string; position: number }[];
};

function fromWork(work: WorkWithLinks | null): FormState {
  if (!work) {
    return {
      slug: '', title: '', vimeo: '', aspect: '16:9', duration: '', thumbnail: '', category_id: '',
      client_name: '', industry: '', year: String(new Date().getFullYear()), short_description: '', tags: [],
      featured: false, published: false, seo_title: '', seo_description: '', case_study: {}, links: [],
    };
  }
  return {
    slug: work.slug,
    title: work.title,
    vimeo: work.vimeo_id,
    aspect: work.aspect,
    duration: work.duration_sec ? String(work.duration_sec) : '',
    thumbnail: work.thumbnail_url ?? '',
    category_id: work.category_id ?? '',
    client_name: work.client_name ?? '',
    industry: work.industry ?? '',
    year: work.year ? String(work.year) : '',
    short_description: work.short_description ?? '',
    tags: work.tags ?? [],
    featured: work.featured,
    published: work.published,
    seo_title: work.seo_title ?? '',
    seo_description: work.seo_description ?? '',
    case_study: work.case_study ?? {},
    links: [...(work.work_services ?? [])].sort((a, b) => a.position - b.position),
  };
}

function ChipInput({ values, onChange, placeholder, label }: { values: string[]; onChange: (next: string[]) => void; placeholder: string; label: string }) {
  const [text, setText] = useState('');
  const add = () => {
    const value = text.trim();
    if (value && !values.includes(value)) onChange([...values, value]);
    setText('');
  };
  return (
    <div className="work-chips-input">
      <div className="work-chips">
        {values.map((v) => (
          <span key={v} className="work-chip">{v}<button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(values.filter((x) => x !== v))}><X size={12} /></button></span>
        ))}
      </div>
      <input
        aria-label={label}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
        onBlur={add}
      />
    </div>
  );
}

function ListEditor({ items, onChange, addLabel, placeholder }: { items: string[]; onChange: (next: string[]) => void; addLabel: string; placeholder: string }) {
  const [text, setText] = useState('');
  const move = (i: number, dir: -1 | 1) => {
    const next = [...items];
    const [item] = next.splice(i, 1);
    next.splice(i + dir, 0, item!);
    onChange(next);
  };
  return (
    <div className="work-list-editor">
      {items.map((item, i) => (
        <div className="work-list-row" key={`${i}-${item}`}>
          <span className="truncate">{item}</span>
          <button type="button" className="admin-icon-btn" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={13} /></button>
          <button type="button" className="admin-icon-btn" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}><ArrowDown size={13} /></button>
          <button type="button" className="admin-icon-btn is-danger" aria-label="Remove" onClick={() => onChange(items.filter((_, x) => x !== i))}><X size={13} /></button>
        </div>
      ))}
      <div className="work-list-add">
        <input placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (text.trim()) { onChange([...items, text.trim()]); setText(''); } } }} />
        <button type="button" className="admin-btn-ghost" onClick={() => { if (text.trim()) { onChange([...items, text.trim()]); setText(''); } }}><Plus size={14} /> {addLabel}</button>
      </div>
    </div>
  );
}

export function WorkEditor({ work, categories, onDirtyChange, onSaved, onCancel }: Props) {
  const [form, setForm] = useState<FormState>(() => fromWork(work));
  const [tab, setTab] = useState<'basics' | 'services' | 'study'>('basics');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const slugTouched = useRef(!!work);
  const titleTouched = useRef(!!work);
  const metaTimer = useRef<number | null>(null);

  const patch = (p: Partial<FormState>) => { setForm((f) => ({ ...f, ...p })); setDirty(true); };
  const patchStudy = (p: Partial<CaseStudy>) => patch({ case_study: { ...form.case_study, ...p } });

  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const vimeoId = useMemo(() => parseVimeoId(form.vimeo), [form.vimeo]);

  // Prefill title, thumbnail, duration and aspect from Vimeo once a valid link is pasted.
  useEffect(() => {
    if (!vimeoId) return;
    if (metaTimer.current) window.clearTimeout(metaTimer.current);
    metaTimer.current = window.setTimeout(() => {
      void getVimeoMeta(vimeoId).then((meta) => {
        if (!meta) return;
        setForm((f) => ({
          ...f,
          title: titleTouched.current ? f.title : (f.title || meta.title),
          thumbnail: f.thumbnail || meta.thumbnailUrl,
          duration: f.duration || (meta.durationSec ? String(meta.durationSec) : ''),
          aspect: meta.aspect,
        }));
        setDirty(true);
      });
    }, 500);
    return () => { if (metaTimer.current) window.clearTimeout(metaTimer.current); };
  }, [vimeoId]);

  const servicesByCategory = useMemo(() =>
    serviceCategories.map((c) => ({ category: c, items: services.filter((s) => s.category === c.id) })).filter((g) => g.items.length),
  []);

  const toggleService = (slug: string) => {
    const exists = form.links.some((l) => l.service_slug === slug);
    if (exists) patch({ links: form.links.filter((l) => l.service_slug !== slug) });
    else patch({ links: [...form.links, { service_slug: slug, position: form.links.length }] });
  };

  const save = async () => {
    const payload = {
      slug: form.slug || slugify(form.title),
      title: form.title.trim(),
      vimeo_id: vimeoId ?? '',
      aspect: form.aspect,
      duration_sec: form.duration ? Number(form.duration) : null,
      thumbnail_url: form.thumbnail.trim() || null,
      category_id: form.category_id || null,
      client_name: form.client_name.trim() || null,
      industry: form.industry.trim() || null,
      year: form.year ? Number(form.year) : null,
      short_description: form.short_description.trim() || null,
      tags: form.tags,
      featured: form.featured,
      published: form.published,
      sort_order: work?.sort_order ?? 0,
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      case_study: form.case_study,
    };
    const parsed = workFormSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      toast.error('Please fix the highlighted fields.');
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (await isWorkSlugTaken(parsed.data.slug, work?.id)) {
        setErrors({ slug: 'Another work already uses this slug.' });
        setTab('basics');
        toast.error('The slug is already taken.');
        return;
      }
      const savePayload = { ...parsed.data, case_study: parsed.data.case_study as CaseStudy };
      const saved = work
        ? await updateWork(work.id, savePayload)
        : await createWork({ ...savePayload, sort_order: 0 });
      await setWorkServices(saved.id, form.links.map((l, i) => ({ service_slug: l.service_slug, position: l.position ?? i })));
      toast.success(work ? 'Work saved' : 'Work added');
      setDirty(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const err = (key: string) => errors[key] ? <span className="work-field-error" role="alert">{errors[key]}</span> : null;

  return (
    <div className="work-editor">
      <button className="admin-btn-ghost booking-page-back" onClick={onCancel}><ArrowLeft size={16} />Back to works</button>
      <div className="admin-chips work-editor-tabs" role="tablist" aria-label="Work editor sections">
        {([['basics', 'Basics'], ['services', 'Services'], ['study', 'Case study']] as const).map(([id, labelText]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'is-active' : ''} onClick={() => setTab(id)}>{labelText}</button>
        ))}
      </div>

      {tab === 'basics' && (
        <div className="admin-form work-form">
          <label>Vimeo link or ID
            <input placeholder="https://vimeo.com/123456789" value={form.vimeo} onChange={(e) => patch({ vimeo: e.target.value })} />
            {err('vimeo_id')}
          </label>
          {vimeoId && (
            <div className="work-preview">
              <iframe title="Vimeo preview" src={`https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
            </div>
          )}
          <div className="admin-form-row">
            <label>Title
              <input value={form.title} onChange={(e) => { titleTouched.current = true; const title = e.target.value; patch(slugTouched.current ? { title } : { title, slug: slugify(title) }); }} />
              {err('title')}
            </label>
            <label>Slug
              <input value={form.slug} onChange={(e) => { slugTouched.current = true; patch({ slug: e.target.value }); }} />
              {err('slug')}
            </label>
          </div>
          <div className="admin-form-row">
            <label>Category
              <select value={form.category_id} onChange={(e) => patch({ category_id: e.target.value })}>
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label>Aspect
              <select value={form.aspect} onChange={(e) => patch({ aspect: e.target.value as WorkAspect })}>
                {WORK_ASPECTS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
          </div>
          <div className="admin-form-row">
            <label>Client name<input value={form.client_name} onChange={(e) => patch({ client_name: e.target.value })} /></label>
            <label>Industry<input value={form.industry} onChange={(e) => patch({ industry: e.target.value })} /></label>
          </div>
          <div className="admin-form-row">
            <label>Year<input inputMode="numeric" value={form.year} onChange={(e) => patch({ year: e.target.value.replace(/\D/g, '').slice(0, 4) })} />{err('year')}</label>
            <label>Duration (seconds)<input inputMode="numeric" value={form.duration} onChange={(e) => patch({ duration: e.target.value.replace(/\D/g, '') })} />{err('duration_sec')}</label>
          </div>
          <label>Thumbnail URL<input type="url" placeholder="https://…" value={form.thumbnail} onChange={(e) => patch({ thumbnail: e.target.value })} />{err('thumbnail_url')}</label>
          <label>Short description
            <textarea rows={3} maxLength={300} value={form.short_description} onChange={(e) => patch({ short_description: e.target.value })} />
            <small className="work-counter">{form.short_description.length}/300</small>
            {err('short_description')}
          </label>
          <label>Tags
            <ChipInput values={form.tags} onChange={(tags) => patch({ tags })} placeholder="Type a tag and press Enter" label="Add a tag" />
          </label>
          <div className="admin-form-row">
            <label>SEO title<input maxLength={160} value={form.seo_title} onChange={(e) => patch({ seo_title: e.target.value })} /></label>
            <label>SEO description<input maxLength={300} value={form.seo_description} onChange={(e) => patch({ seo_description: e.target.value })} /></label>
          </div>
          <div className="work-switches">
            <label className="work-switch-row">
              <button type="button" role="switch" aria-checked={form.published} className={`work-switch ${form.published ? 'is-on' : ''}`} onClick={() => patch({ published: !form.published })}><span /></button>
              Published on the site
            </label>
            <label className="work-switch-row">
              <button type="button" role="switch" aria-checked={form.featured} className={`work-switch ${form.featured ? 'is-on' : ''}`} onClick={() => patch({ featured: !form.featured })}><span /></button>
              Featured
            </label>
          </div>
        </div>
      )}

      {tab === 'services' && (
        <div className="admin-form work-form">
          <p className="admin-hint">Pick the services this video belongs to. Lower position numbers show first on the service page.</p>
          {servicesByCategory.map(({ category, items }) => (
            <div key={category.id} className="work-service-group">
              <p className="admin-label">{category.name}</p>
              <div className="work-service-grid">
                {items.map((s) => {
                  const link = form.links.find((l) => l.service_slug === s.slug);
                  return (
                    <div key={s.slug} className={`work-service-item ${link ? 'is-on' : ''}`}>
                      <label>
                        <input type="checkbox" checked={!!link} onChange={() => toggleService(s.slug)} />
                        <span>{s.name}</span>
                      </label>
                      {link && (
                        <input
                          aria-label={`Position for ${s.name}`}
                          inputMode="numeric"
                          value={String(link.position)}
                          onChange={(e) => {
                            const n = Number(e.target.value.replace(/\D/g, '') || '0');
                            patch({ links: form.links.map((l) => l.service_slug === s.slug ? { ...l, position: n } : l) });
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'study' && (
        <div className="admin-form work-form">
          <label className="work-switch-row">
            <button type="button" role="switch" aria-checked={!!form.case_study.is_sample} className={`work-switch ${form.case_study.is_sample ? 'is-on' : ''}`} onClick={() => patchStudy({ is_sample: !form.case_study.is_sample })}><span /></button>
            Sample case study (not a real client project)
          </label>
          <label>Overview<textarea rows={4} value={form.case_study.overview ?? ''} onChange={(e) => patchStudy({ overview: e.target.value })} /></label>
          <label>Problems<ListEditor items={form.case_study.problems ?? []} onChange={(problems) => patchStudy({ problems })} addLabel="Add problem" placeholder="A problem the client had" /></label>
          <label>Solutions<ListEditor items={form.case_study.solutions ?? []} onChange={(solutions) => patchStudy({ solutions })} addLabel="Add solution" placeholder="How you solved it" /></label>
          <div>
            <p className="admin-label">Process steps</p>
            {(form.case_study.process ?? []).map((step, i, arr) => (
              <div className="work-process-row" key={i}>
                <input aria-label="Step title" placeholder="Step title" value={step.title} onChange={(e) => patchStudy({ process: arr.map((s, x) => x === i ? { ...s, title: e.target.value } : s) })} />
                <textarea aria-label="Step details" rows={2} placeholder="What happens in this step" value={step.body} onChange={(e) => patchStudy({ process: arr.map((s, x) => x === i ? { ...s, body: e.target.value } : s) })} />
                <div className="work-process-actions">
                  <button type="button" className="admin-icon-btn" aria-label="Move step up" disabled={i === 0} onClick={() => { const next = [...arr]; const [s] = next.splice(i, 1); next.splice(i - 1, 0, s!); patchStudy({ process: next }); }}><ArrowUp size={13} /></button>
                  <button type="button" className="admin-icon-btn" aria-label="Move step down" disabled={i === arr.length - 1} onClick={() => { const next = [...arr]; const [s] = next.splice(i, 1); next.splice(i + 1, 0, s!); patchStudy({ process: next }); }}><ArrowDown size={13} /></button>
                  <button type="button" className="admin-icon-btn is-danger" aria-label="Remove step" onClick={() => patchStudy({ process: arr.filter((_, x) => x !== i) })}><X size={13} /></button>
                </div>
              </div>
            ))}
            <button type="button" className="admin-btn-ghost" onClick={() => patchStudy({ process: [...(form.case_study.process ?? []), { title: '', body: '' }] })}><Plus size={14} /> Add step</button>
          </div>
          <label>Tools<ChipInput values={form.case_study.tools ?? []} onChange={(tools) => patchStudy({ tools })} placeholder="Type a tool and press Enter" label="Add a tool" /></label>
          <label>Deliverables<ListEditor items={form.case_study.deliverables ?? []} onChange={(deliverables) => patchStudy({ deliverables })} addLabel="Add deliverable" placeholder="What the client received" /></label>
          <label>Result<textarea rows={3} value={form.case_study.result ?? ''} onChange={(e) => patchStudy({ result: e.target.value })} /></label>
          <div>
            <p className="admin-label">Metrics (optional)</p>
            {(form.case_study.metrics ?? []).map((m, i, arr) => (
              <div className="work-metric-row" key={i}>
                <input aria-label="Metric label" placeholder="Label, e.g. Watch time" value={m.label} onChange={(e) => patchStudy({ metrics: arr.map((x, xi) => xi === i ? { ...x, label: e.target.value } : x) })} />
                <input aria-label="Metric value" placeholder="Value, e.g. +40%" value={m.value} onChange={(e) => patchStudy({ metrics: arr.map((x, xi) => xi === i ? { ...x, value: e.target.value } : x) })} />
                <button type="button" className="admin-icon-btn is-danger" aria-label="Remove metric" onClick={() => patchStudy({ metrics: arr.filter((_, x) => x !== i) })}><X size={13} /></button>
              </div>
            ))}
            <button type="button" className="admin-btn-ghost" onClick={() => patchStudy({ metrics: [...(form.case_study.metrics ?? []), { label: '', value: '' }] })}><Plus size={14} /> Add metric</button>
          </div>
          <div>
            <p className="admin-label">Testimonial (optional)</p>
            <div className="admin-form work-form">
              <textarea aria-label="Testimonial quote" rows={2} placeholder="Quote" value={form.case_study.testimonial?.quote ?? ''} onChange={(e) => patchStudy({ testimonial: { quote: e.target.value, name: form.case_study.testimonial?.name ?? '', role: form.case_study.testimonial?.role ?? '' } })} />
              <div className="admin-form-row">
                <input aria-label="Testimonial name" placeholder="Name" value={form.case_study.testimonial?.name ?? ''} onChange={(e) => patchStudy({ testimonial: { quote: form.case_study.testimonial?.quote ?? '', name: e.target.value, role: form.case_study.testimonial?.role ?? '' } })} />
                <input aria-label="Testimonial role" placeholder="Role" value={form.case_study.testimonial?.role ?? ''} onChange={(e) => patchStudy({ testimonial: { quote: form.case_study.testimonial?.quote ?? '', name: form.case_study.testimonial?.name ?? '', role: e.target.value } })} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="admin-dialog-actions work-editor-actions">
        <button className="admin-btn-ghost" onClick={onCancel} disabled={saving}>Cancel</button>
        <button className="admin-btn" onClick={() => void save()} disabled={saving}>{saving ? 'Saving…' : work ? 'Save changes' : 'Add video'}</button>
      </div>
    </div>
  );
}
