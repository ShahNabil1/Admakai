import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FolderOpen, LayoutList, Layers, ArrowUpDown } from 'lucide-react';
import type { WorkCategory } from '@/types/work';
import { listCategories, type WorkWithLinks } from '@/lib/works';
import { listAllWorks } from '@/lib/work-admin';
import { Empty, useConfirm } from './ui';
import { WorksList } from './WorksList';
import { WorkEditor } from './WorkEditor';
import { WorkCategories } from './WorkCategories';
import { WorkServices } from './WorkServices';
import { WorkImport } from './WorkImport';
import { useQuery } from '@tanstack/react-query';
import { siteCatalogueQueryOptions } from '@/lib/site-catalogue-query';
import { applyCatalogue } from '@/lib/site-content';
import './work-admin.css';

export type WorkView =
  | { name: 'list' }
  | { name: 'new' }
  | { name: 'edit'; id: string }
  | { name: 'categories' }
  | { name: 'services' }
  | { name: 'import' };

const SUBNAV: { id: WorkView['name']; label: string; icon: typeof LayoutList }[] = [
  { id: 'list', label: 'Works', icon: LayoutList },
  { id: 'categories', label: 'Categories', icon: Layers },
  { id: 'services', label: 'Service portfolios', icon: FolderOpen },
  { id: 'import', label: 'Import / Export', icon: ArrowUpDown },
];

function readView(): WorkView {
  const params = new URLSearchParams(window.location.search);
  const work = params.get('work');
  const id = params.get('work_id');
  if (work === 'new') return { name: 'new' };
  if (work === 'edit' && id) return { name: 'edit', id };
  if (work === 'categories') return { name: 'categories' };
  if (work === 'services') return { name: 'services' };
  if (work === 'import') return { name: 'import' };
  return { name: 'list' };
}

export function WorkAdmin() {
  // Service choices follow the live published catalogue (admin sits outside the public layout that applies it).
  const catalogue = useQuery(siteCatalogueQueryOptions);
  if (catalogue.data) applyCatalogue(catalogue.data);
  const [view, setViewState] = useState<WorkView>(readView);
  const [works, setWorks] = useState<WorkWithLinks[] | null>(null);
  const [categories, setCategories] = useState<WorkCategory[] | null>(null);
  const [dirty, setDirty] = useState(false);
  const { confirm, node: confirmNode } = useConfirm();

  const reload = useCallback(async () => {
    const [w, c] = await Promise.all([listAllWorks(), listCategories()]);
    setWorks(w);
    setCategories(c);
  }, []);

  useEffect(() => {
    reload().catch(() => toast.error('Work data could not be loaded.'));
  }, [reload]);

  const setView = useCallback((next: WorkView, replace = false) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'work');
    url.searchParams.delete('booking');
    if (next.name === 'list') {
      url.searchParams.delete('work');
      url.searchParams.delete('work_id');
    } else {
      url.searchParams.set('work', next.name);
      if (next.name === 'edit') url.searchParams.set('work_id', next.id);
      else url.searchParams.delete('work_id');
    }
    if (replace) window.history.replaceState(null, '', url);
    else window.history.pushState(null, '', url);
    setViewState(next);
    setDirty(false);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const sync = () => { setViewState(readView()); setDirty(false); };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  const go = useCallback((next: WorkView) => {
    if (!dirty || (view.name === next.name && (view.name !== 'edit' || next.name !== 'edit' || view.id === next.id))) {
      setView(next);
      return;
    }
    confirm({
      title: 'Leave without saving?',
      description: 'Your unsaved changes to this work will be lost.',
      confirmLabel: 'Leave',
      danger: true,
      run: async () => { setView(next); },
    });
  }, [dirty, view, confirm, setView]);

  const subActive = view.name === 'new' || view.name === 'edit' ? 'list' : view.name;

  return (
    <section className="work-admin">
      <header className="admin-head">
        <div><p className="admin-eyebrow">Portfolio</p><h1>Work</h1></div>
        <div className="admin-chips work-subnav" role="tablist" aria-label="Work sections">
          {SUBNAV.map((n) => (
            <button key={n.id} role="tab" aria-selected={subActive === n.id} className={subActive === n.id ? 'is-active' : ''} onClick={() => go({ name: n.id } as WorkView)}>
              <n.icon size={14} /> {n.label}
            </button>
          ))}
        </div>
      </header>

      {works === null || categories === null ? <div className="admin-skeleton" /> : (
        <>
          {view.name === 'list' && <WorksList works={works} categories={categories} onReload={reload} onNew={() => go({ name: 'new' })} onEdit={(id) => go({ name: 'edit', id })} />}
          {(view.name === 'new' || (view.name === 'edit' && works.some((w) => w.id === view.id))) && (
            <WorkEditor
              key={view.name === 'edit' ? view.id : 'new'}
              work={view.name === 'edit' ? works.find((w) => w.id === view.id) ?? null : null}
              categories={categories}
              onDirtyChange={setDirty}
              onSaved={() => { void reload(); setView({ name: 'list' }); }}
              onCancel={() => go({ name: 'list' })}
            />
          )}
          {view.name === 'edit' && !works.some((w) => w.id === (view as { id: string }).id) && <Empty title="Work not found" hint="It may have been deleted." />}
          {view.name === 'categories' && <WorkCategories categories={categories} works={works} onReload={reload} />}
          {view.name === 'services' && <WorkServices works={works} onReload={reload} />}
          {view.name === 'import' && <WorkImport works={works} categories={categories} onReload={reload} />}
        </>
      )}
      {confirmNode}
    </section>
  );
}
