import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import type { WorkCategory } from '@/types/work';
import { createCategory, deleteCategory, reorderCategories, updateCategory, type WorkWithLinks } from '@/lib/works';
import { slugify } from '@/lib/work-schemas';
import { Empty, useConfirm } from './ui';

type Props = { categories: WorkCategory[]; works: WorkWithLinks[]; onReload: () => Promise<void> };

export function WorkCategories({ categories, works, onReload }: Props) {
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const { confirm, node: confirmNode } = useConfirm();

  const add = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const slug = slugify(trimmed);
    if (categories.some((c) => c.slug === slug)) { toast.error('A category with this slug already exists.'); return; }
    try {
      await createCategory({ slug, name: trimmed, sort_order: categories.length });
      toast.success('Category added');
      setName('');
      await onReload();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not add.'); }
  };

  const saveEdit = async (id: string) => {
    const slug = slugify(editSlug);
    if (!editName.trim() || !slug) { toast.error('Name and slug are required.'); return; }
    if (categories.some((c) => c.slug === slug && c.id !== id)) { toast.error('Another category already uses this slug.'); return; }
    try {
      await updateCategory(id, { name: editName.trim(), slug });
      toast.success('Category saved');
      setEditing(null);
      await onReload();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save.'); }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...categories];
    const [item] = next.splice(index, 1);
    next.splice(index + dir, 0, item!);
    try {
      await reorderCategories(next.map((c) => c.id));
      await onReload();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not reorder.'); }
  };

  const remove = (category: WorkCategory) => {
    const count = works.filter((w) => w.category_id === category.id).length;
    confirm({
      title: `Delete "${category.name}"?`,
      description: count > 0
        ? `${count} work${count === 1 ? '' : 's'} in this category will keep existing but will have no category.`
        : 'This category has no works. This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
      run: async () => {
        try {
          await deleteCategory(category.id);
          toast.success('Category deleted');
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
    <div className="work-categories">
      <div className="work-list-add">
        <input placeholder="New category name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void add(); } }} />
        <button className="admin-btn" onClick={() => void add()} disabled={!name.trim()}><Plus size={15} /> Add category</button>
      </div>
      {categories.length === 0 ? <Empty title="No categories yet" /> : (
        <div className="work-table" role="table" aria-label="Work categories">
          {categories.map((c, i) => (
            <div className="work-row is-category" role="row" key={c.id}>
              {editing === c.id ? (
                <>
                  <input aria-label="Category name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  <input aria-label="Category slug" value={editSlug} onChange={(e) => setEditSlug(e.target.value)} />
                  <span className="work-cell-actions">
                    <button className="admin-btn" onClick={() => void saveEdit(c.id)}>Save</button>
                    <button className="admin-btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
                  </span>
                </>
              ) : (
                <>
                  <div className="min-w-0"><strong className="truncate">{c.name}</strong><small className="work-slug">{c.slug}</small></div>
                  <span className="work-cell-count">{works.filter((w) => w.category_id === c.id).length} works</span>
                  <span className="work-cell-actions">
                    <button className="admin-icon-btn" aria-label={`Move ${c.name} up`} disabled={i === 0} onClick={() => void move(i, -1)}><ArrowUp size={14} /></button>
                    <button className="admin-icon-btn" aria-label={`Move ${c.name} down`} disabled={i === categories.length - 1} onClick={() => void move(i, 1)}><ArrowDown size={14} /></button>
                    <button className="admin-icon-btn" aria-label={`Edit ${c.name}`} onClick={() => { setEditing(c.id); setEditName(c.name); setEditSlug(c.slug); }}><Pencil size={14} /></button>
                    <button className="admin-icon-btn is-danger" aria-label={`Delete ${c.name}`} onClick={() => remove(c)}><Trash2 size={14} /></button>
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      {confirmNode}
    </div>
  );
}
