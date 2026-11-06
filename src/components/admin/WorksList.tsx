import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { WorkCategory } from '@/types/work';
import { deleteWork, updateWork, type WorkWithLinks } from '@/lib/works';
import { swapWorkOrder } from '@/lib/work-admin';
import { formatDuration } from '@/lib/vimeo';
import { Empty, useConfirm } from './ui';

type Props = {
  works: WorkWithLinks[];
  categories: WorkCategory[];
  onReload: () => Promise<void>;
  onNew: () => void;
  onEdit: (id: string) => void;
};

function WorkSwitch({ checked, label, onToggle }: { checked: boolean; label: string; onToggle: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`work-switch ${checked ? 'is-on' : ''}`} onClick={onToggle}>
      <span />
    </button>
  );
}

export function WorksList({ works, categories, onReload, onNew, onEdit }: Props) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [state, setState] = useState<'all' | 'published' | 'draft'>('all');
  const [study, setStudy] = useState<'all' | 'sample' | 'real'>('all');
  const { confirm, node: confirmNode } = useConfirm();

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return works.filter((w) => {
      if (category !== 'all' && w.work_categories?.slug !== category) return false;
      if (state === 'published' && !w.published) return false;
      if (state === 'draft' && w.published) return false;
      if (study === 'sample' && !w.case_study?.is_sample) return false;
      if (study === 'real' && w.case_study?.is_sample) return false;
      if (!needle) return true;
      const hay = `${w.title} ${w.client_name ?? ''} ${(w.tags ?? []).join(' ')}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [works, q, category, state, study]);

  const reordering = !q.trim() && category === 'all' && state === 'all' && study === 'all';

  const toggle = async (work: WorkWithLinks, field: 'published' | 'featured') => {
    const { error } = await updateWork(work.id, { [field]: !work[field] }).then(() => ({ error: null }), (e: Error) => ({ error: e }));
    if (error) { toast.error(error.message); return; }
    toast.success(field === 'published' ? (work.published ? 'Unpublished' : 'Published') : (work.featured ? 'Removed from featured' : 'Marked featured'));
    await onReload();
  };

  const move = async (work: WorkWithLinks, dir: -1 | 1) => {
    const index = works.findIndex((w) => w.id === work.id);
    const neighbor = works[index + dir];
    if (!neighbor) return;
    try {
      await swapWorkOrder(work, neighbor);
      await onReload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not reorder.');
    }
  };

  const remove = (work: WorkWithLinks) => {
    confirm({
      title: `Delete "${work.title}"?`,
      description: 'The video and its service links are removed permanently. This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
      run: async () => {
        try {
          await deleteWork(work.id);
          toast.success('Work deleted');
          await onReload();
          return true;
        } catch (e) {
          toast.error(e instanceof Error ? e.message : 'Could not delete.');
          return false;
        }
      },
    });
  };

  return (
    <div>
      <div className="work-toolbar">
        <label className="admin-search"><Search size={15} /><input type="search" placeholder="Search title, client or tag" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <select aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <select aria-label="Filter by status" value={state} onChange={(e) => setState(e.target.value as typeof state)}>
          <option value="all">Published and drafts</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
        <select aria-label="Filter by case study" value={study} onChange={(e) => setStudy(e.target.value as typeof study)}>
          <option value="all">All case studies</option>
          <option value="sample">Sample case study</option>
          <option value="real">Real case study</option>
        </select>
        <button className="admin-btn" onClick={onNew}><Plus size={15} /> Add video</button>
      </div>
      {!reordering && <p className="admin-hint">Clear the search and filters to reorder works.</p>}

      {filtered.length === 0 ? <Empty title="No works match" hint="Add a video to start the portfolio." /> : (
        <div className="work-table" role="table" aria-label="Works">
          <div className="work-row is-head" role="row">
            <span>Video</span><span>Category</span><span>Services</span><span>Published</span><span>Featured</span><span>Order</span><span>Actions</span>
          </div>
          {filtered.map((w) => (
            <div className="work-row" role="row" key={w.id}>
              <div className="work-cell-video">
                {w.thumbnail_url ? <img src={w.thumbnail_url} alt="" loading="lazy" /> : <span className="work-thumb-empty">{formatDuration(w.duration_sec)}</span>}
                <div className="min-w-0">
                  <strong className="truncate">{w.title}</strong>
                  <small className="truncate">{w.client_name || w.slug}</small>
                </div>
              </div>
              <span className="work-cell-cat">{w.work_categories?.name ?? 'No category'}</span>
              <span className="work-cell-count">{w.work_services?.length ?? 0}</span>
              <span><WorkSwitch checked={w.published} label={`Published: ${w.title}`} onToggle={() => void toggle(w, 'published')} /></span>
              <span><WorkSwitch checked={w.featured} label={`Featured: ${w.title}`} onToggle={() => void toggle(w, 'featured')} /></span>
              <span className="work-cell-order">
                <button className="admin-icon-btn" aria-label={`Move ${w.title} up`} disabled={!reordering} onClick={() => void move(w, -1)}><ArrowUp size={14} /></button>
                <button className="admin-icon-btn" aria-label={`Move ${w.title} down`} disabled={!reordering} onClick={() => void move(w, 1)}><ArrowDown size={14} /></button>
              </span>
              <span className="work-cell-actions">
                <button className="admin-icon-btn" aria-label={`Edit ${w.title}`} onClick={() => onEdit(w.id)}><Pencil size={14} /></button>
                <a className="admin-icon-btn" aria-label={`View ${w.title} on the site`} href={`/work/${w.slug}`} target="_blank" rel="noreferrer"><ExternalLink size={14} /></a>
                <button className="admin-icon-btn is-danger" aria-label={`Delete ${w.title}`} onClick={() => remove(w)}><Trash2 size={14} /></button>
              </span>
            </div>
          ))}
        </div>
      )}
      {confirmNode}
    </div>
  );
}
