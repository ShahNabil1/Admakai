import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Plus, Search, X } from 'lucide-react';
import { reorderServiceWorks, setWorkServices, type WorkWithLinks } from '@/lib/works';
import { serviceCategories, services } from '@/data/services';
import { Empty } from './ui';

type Props = { works: WorkWithLinks[]; onReload: () => Promise<void> };

export function WorkServices({ works, onReload }: Props) {
  const [serviceSlug, setServiceSlug] = useState(services[0]?.slug ?? '');
  const [q, setQ] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);

  const linked = useMemo(() => {
    return works
      .filter((w) => w.work_services?.some((s) => s.service_slug === serviceSlug))
      .sort((a, b) => {
        const pa = a.work_services.find((s) => s.service_slug === serviceSlug)?.position ?? 0;
        const pb = b.work_services.find((s) => s.service_slug === serviceSlug)?.position ?? 0;
        return pa - pb;
      });
  }, [works, serviceSlug]);

  const candidates = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return works
      .filter((w) => !w.work_services?.some((s) => s.service_slug === serviceSlug))
      .filter((w) => !needle || `${w.title} ${w.client_name ?? ''}`.toLowerCase().includes(needle))
      .slice(0, 8);
  }, [works, serviceSlug, q]);

  const saveOrder = async (ordered: WorkWithLinks[]) => {
    try {
      await reorderServiceWorks(serviceSlug, ordered.map((w) => w.id));
      toast.success('Order saved');
      await onReload();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save the order.'); }
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = [...linked];
    const [item] = next.splice(index, 1);
    next.splice(index + dir, 0, item!);
    void saveOrder(next);
  };

  const drop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const next = [...linked];
    const from = next.findIndex((w) => w.id === dragId);
    const to = next.findIndex((w) => w.id === targetId);
    if (from < 0 || to < 0) return;
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    setDragId(null);
    void saveOrder(next);
  };

  const unlink = async (work: WorkWithLinks) => {
    try {
      await setWorkServices(work.id, (work.work_services ?? []).filter((s) => s.service_slug !== serviceSlug));
      toast.success('Removed from this service');
      await onReload();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not remove the link.'); }
  };

  const link = async (work: WorkWithLinks) => {
    try {
      const position = linked.length;
      await setWorkServices(work.id, [...(work.work_services ?? []), { service_slug: serviceSlug, position }]);
      toast.success('Added to this service');
      setQ('');
      await onReload();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not add the link.'); }
  };

  return (
    <div className="work-services">
      <p className="admin-note">If a service has no videos, its page shows videos from other services in the same category.</p>
      <label className="admin-form work-service-picker">Service
        <select value={serviceSlug} onChange={(e) => setServiceSlug(e.target.value)}>
          {serviceCategories.map((c) => (
            <optgroup key={c.id} label={c.name}>
              {services.filter((s) => s.category === c.id).map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
            </optgroup>
          ))}
        </select>
      </label>

      <h3 className="admin-sub">Linked videos ({linked.length})</h3>
      {linked.length === 0 ? <Empty title="No videos linked" hint="Add an existing work below." /> : (
        <div className="work-table">
          {linked.map((w, i) => (
            <div
              className={`work-row is-linked ${dragId === w.id ? 'is-drag' : ''}`}
              key={w.id}
              draggable
              onDragStart={() => setDragId(w.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => drop(w.id)}
              onDragEnd={() => setDragId(null)}
            >
              <div className="work-cell-video">
                {w.thumbnail_url ? <img src={w.thumbnail_url} alt="" loading="lazy" /> : <span className="work-thumb-empty">No image</span>}
                <div className="min-w-0"><strong className="truncate">{w.title}</strong><small className="truncate">{w.slug}</small></div>
              </div>
              <span className="work-cell-actions">
                <button className="admin-icon-btn" aria-label={`Move ${w.title} up`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={14} /></button>
                <button className="admin-icon-btn" aria-label={`Move ${w.title} down`} disabled={i === linked.length - 1} onClick={() => move(i, 1)}><ArrowDown size={14} /></button>
                <button className="admin-icon-btn is-danger" aria-label={`Remove ${w.title} from this service`} onClick={() => void unlink(w)}><X size={14} /></button>
              </span>
            </div>
          ))}
        </div>
      )}

      <h3 className="admin-sub">Add an existing work</h3>
      <label className="admin-search"><Search size={15} /><input type="search" placeholder="Search by title or client" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      {q.trim() && (
        <div className="work-table">
          {candidates.length === 0 ? <Empty title="No unlinked works match" /> : candidates.map((w) => (
            <div className="work-row is-linked" key={w.id}>
              <div className="work-cell-video">
                {w.thumbnail_url ? <img src={w.thumbnail_url} alt="" loading="lazy" /> : <span className="work-thumb-empty">No image</span>}
                <div className="min-w-0"><strong className="truncate">{w.title}</strong><small className="truncate">{w.client_name || w.slug}</small></div>
              </div>
              <span className="work-cell-actions">
                <button className="admin-btn-ghost" onClick={() => void link(w)}><Plus size={14} /> Add</button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
