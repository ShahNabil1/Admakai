import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, ExternalLink, FolderTree, GripVertical, Plus, Search } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { reorderSiteContent } from '@/lib/site-content.functions';
import { formatCurrencyRange } from '@/lib/currency-rules';
import { moveItem } from '@/lib/site-content-rules';
import { Empty, fmtDate } from '../ui';
import { useDragOrder } from './fields';
import { CategoryPanel } from './CategoryPanel';
import { ServiceEditor } from './ServiceEditor';
import { useRefreshSiteContent, type AdminData } from './SiteContent';

export function ServicesTab({ data, item, openItem }: { data: AdminData; item: string | null; openItem: (item: string | null) => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [order, setOrder] = useState<string[] | null>(null);
  const reorder = useServerFn(reorderSiteContent);
  const refresh = useRefreshSiteContent();
  const names = useMemo(() => Object.fromEntries(data.categories.map(c => [c.slug, c.name])), [data.categories]);
  const ordered = useMemo(() => {
    if (!order) return data.services;
    const byId = new Map(data.services.map(s => [s.id, s]));
    return order.flatMap(id => byId.get(id) ?? []);
  }, [data.services, order]);
  const filtering = query.trim() !== '' || category !== 'all';
  const q = query.trim().toLowerCase();
  const rows = ordered.filter(s => (category === 'all' || s.category === category) && (!q || s.name.toLowerCase().includes(q) || s.slug.includes(q)));

  const persist = async (next: typeof data.services) => {
    const previous = order;
    setOrder(next.map(s => s.id));
    try { await reorder({ data: { kind: 'services', ids: next.map(s => s.id) } }); toast.success('Order saved'); await refresh(); setOrder(null); }
    catch (e) { setOrder(previous); toast.error(e instanceof Error ? e.message : 'The new order could not be saved.'); }
  };
  const drag = useDragOrder(rows, next => void persist(next), !filtering);

  if (item) {
    const row = item === 'new' ? null : data.services.find(s => s.id === item) ?? undefined;
    if (row === undefined) return <Empty title="Service not found" hint="It may have been removed." />;
    return <ServiceEditor key={item} row={row} data={data} onClose={() => openItem(null)} onCreated={id => openItem(id)} />;
  }

  return <>
    <div className="work-toolbar sc-toolbar">
      <label className="sc-search"><Search size={15} aria-hidden="true" /><input type="search" placeholder="Search services" aria-label="Search services" value={query} onChange={e => setQuery(e.target.value)} /></label>
      <select aria-label="Filter by category" value={category} onChange={e => setCategory(e.target.value)}>
        <option value="all">All categories</option>
        {data.categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
      </select>
      <button type="button" className="admin-btn-ghost" onClick={() => setCategoriesOpen(true)}><FolderTree size={15} />Categories</button>
      <button type="button" className="admin-btn" onClick={() => openItem('new')}><Plus size={15} />New service</button>
    </div>
    <p className="admin-hint sc-note">{filtering ? 'Clear the search and category filter to change the order.' : 'Drag rows, or use the arrows, to change the order on the site.'}</p>
    {rows.length === 0 ? <Empty title="No services match" hint="Try another search or category." /> :
      <div className="work-table sc-table" role="table" aria-label="Services">
        <div className="sc-row is-head" role="row"><span /><span>Name</span><span>Category</span><span>Price range</span><span>Published</span><span>Featured</span><span>Last updated</span><span /></div>
        {rows.map((s, i) => <div key={s.id} role="row" className={`sc-row ${drag.dragging === i ? 'is-drag' : ''}`} {...drag.props(i)}>
          <span className="sc-grip" aria-hidden="true">{!filtering && <GripVertical size={15} />}</span>
          <button type="button" className="sc-name" onClick={() => openItem(s.id)}><strong>{s.name}</strong><small>/{s.slug}</small></button>
          <span data-label="Category">{names[s.category] ?? s.category}</span>
          <span data-label="Price range">{formatCurrencyRange(Number(s.price_min), Number(s.price_max))}{s.price_unit !== 'project' ? ` per ${s.price_unit}` : ''}</span>
          <span data-label="Published"><span className={`admin-pill ${s.is_published ? 'is-confirmed' : 'is-cancelled'}`}>{s.is_published ? 'Published' : 'Hidden'}</span></span>
          <span data-label="Featured">{s.is_featured ? 'Featured' : 'No'}</span>
          <span data-label="Last updated">{fmtDate(s.updated_at)}</span>
          <span className="sc-row-actions">
            {!filtering && <><button type="button" className="admin-icon-btn" aria-label={`Move ${s.name} up`} disabled={i === 0} onClick={() => void persist(moveItem(rows, i, i - 1))}><ArrowUp size={14} /></button>
            <button type="button" className="admin-icon-btn" aria-label={`Move ${s.name} down`} disabled={i === rows.length - 1} onClick={() => void persist(moveItem(rows, i, i + 1))}><ArrowDown size={14} /></button></>}
            {s.is_published && <a className="admin-icon-btn" href={`/services/${s.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`View ${s.name} on site`}><ExternalLink size={14} /></a>}
          </span>
        </div>)}
      </div>}
    <CategoryPanel open={categoriesOpen} onOpenChange={setCategoriesOpen} data={data} />
  </>;
}
