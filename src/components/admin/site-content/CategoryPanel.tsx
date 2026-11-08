import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { deleteSiteCategory, reorderSiteContent, saveSiteCategory } from '@/lib/site-content.functions';
import { categoryValuesSchema, moveItem, type CategoryValues } from '@/lib/site-content-rules';
import { slugify } from '@/lib/site-content-editor';
import { useConfirm } from '../ui';
import { Field, useDragOrder } from './fields';
import { useRefreshSiteContent, type AdminData } from './SiteContent';

const blank: CategoryValues = { slug: '', name: '', intro: '' };

export function CategoryPanel({ open, onOpenChange, data }: { open: boolean; onOpenChange: (o: boolean) => void; data: AdminData }) {
  const save = useServerFn(saveSiteCategory);
  const remove = useServerFn(deleteSiteCategory);
  const reorder = useServerFn(reorderSiteContent);
  const refresh = useRefreshSiteContent();
  const { confirm, node } = useConfirm();
  const [editing, setEditing] = useState<string | null>(null);
  const [values, setValues] = useState<CategoryValues>(blank);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const used = (slug: string) => data.services.filter(s => s.category === slug).length;

  const persistOrder = async (next: AdminData['categories']) => {
    try { await reorder({ data: { kind: 'service_categories', ids: next.map(c => c.id) } }); toast.success('Order saved'); await refresh(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'The new order could not be saved.'); }
  };
  const drag = useDragOrder(data.categories, next => void persistOrder(next));
  const submit = async () => {
    const parsed = categoryValuesSchema.safeParse(values);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Check the category fields.'); return; }
    setBusy(true); setError(null);
    try { await save({ data: { id: editing, values: parsed.data } }); toast.success('Saved'); await refresh(); setEditing(null); setValues(blank); }
    catch (e) { setError(e instanceof Error ? e.message : 'This change could not be saved.'); }
    finally { setBusy(false); }
  };

  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent data-lenis-prevent className="sc-sheet">
      <SheetHeader><SheetTitle>Service categories</SheetTitle><SheetDescription>Order here sets the order of category groups on /services and /pricing.</SheetDescription></SheetHeader>
      <div className="work-list-editor sc-categories">
        {data.categories.map((c, i) => <div key={c.id} className={`work-list-row sc-category-row ${drag.dragging === i ? 'is-drag' : ''}`} {...drag.props(i)}>
          <span className="sc-category-name"><GripVertical size={14} aria-hidden="true" /><span><strong>{c.name}</strong><small>{used(c.slug)} services</small></span></span>
          <button type="button" className="admin-icon-btn" aria-label={`Move ${c.name} up`} disabled={i === 0} onClick={() => void persistOrder(moveItem(data.categories, i, i - 1))}><ArrowUp size={14} /></button>
          <button type="button" className="admin-icon-btn" aria-label={`Move ${c.name} down`} disabled={i === data.categories.length - 1} onClick={() => void persistOrder(moveItem(data.categories, i, i + 1))}><ArrowDown size={14} /></button>
          <button type="button" className="admin-icon-btn" aria-label={`Edit ${c.name}`} onClick={() => { setEditing(c.id); setValues({ slug: c.slug, name: c.name, intro: c.intro }); setError(null); }}><Pencil size={14} /></button>
          <button type="button" className="admin-icon-btn is-danger" aria-label={`Delete ${c.name}`} disabled={used(c.slug) > 0} title={used(c.slug) > 0 ? 'Move its services to another category first' : undefined}
            onClick={() => confirm({ title: `Delete ${c.name}?`, description: 'This category has no services. It will be removed from the site.', confirmLabel: 'Delete', danger: true, run: async () => {
              try { await remove({ data: { id: c.id } }); toast.success('Category deleted'); await refresh(); return true; } catch (e) { toast.error(e instanceof Error ? e.message : 'This category could not be deleted.'); return false; }
            } })}><Trash2 size={14} /></button>
        </div>)}
      </div>
      <form className="admin-form work-form sc-category-form" onSubmit={e => { e.preventDefault(); void submit(); }}>
        <p className="admin-label">{editing ? 'Edit category' : 'Add a category'}</p>
        <Field label="Name"><input value={values.name} onChange={e => setValues(v => ({ ...v, name: e.target.value, slug: editing || v.slug ? v.slug : slugify(e.target.value) }))} /></Field>
        <Field label="URL slug" hint={editing ? 'Changing it updates every service in this category.' : undefined}><input value={values.slug} onChange={e => setValues(v => ({ ...v, slug: e.target.value }))} /></Field>
        <Field label="Intro" counter={{ value: values.intro.length, max: 400 }}><textarea rows={3} value={values.intro} onChange={e => setValues(v => ({ ...v, intro: e.target.value }))} /></Field>
        {error && <p className="work-field-error" role="alert">{error}</p>}
        <div className="sc-actions">{editing && <button type="button" className="admin-btn-ghost" onClick={() => { setEditing(null); setValues(blank); setError(null); }}>Cancel</button>}<button type="submit" className="admin-btn" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save category' : 'Add category'}</button></div>
      </form>
      {node}
    </SheetContent>
  </Sheet>;
}
