import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ActivityRow } from '@/lib/activity';
import { Empty, Timeline } from './ui';

const FILTERS = [['all', 'All'], ['leads', 'Leads'], ['bookings', 'Bookings'], ['projects', 'Projects'], ['tasks', 'Tasks'], ['deliverables', 'Deliverables'], ['invoices', 'Invoices'], ['payments', 'Payments'], ['site', 'Site content']] as const;
const SITE_TYPES = ['services', 'plans', 'service_categories', 'offers'];

export async function fetchActivity(entityIds?: string[]) {
  let q = supabase.from('activity').select('id, entity_type, entity_id, actor_id, verb, from_value, to_value, meta, created_at').order('created_at', { ascending: false }).limit(entityIds ? 50 : 300);
  if (entityIds) q = q.in('entity_id', entityIds);
  const { data } = await q;
  return (data ?? []) as ActivityRow[];
}

export function ActivityLog({ names }: { names: Record<string, string> }) {
  const [rows, setRows] = useState<ActivityRow[] | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const load = useCallback(async () => setRows(await fetchActivity()), []);
  useEffect(() => {
    void load();
    const ch = supabase.channel('admin-activity').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity' }, () => void load()).subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [load]);

  const shown = (rows ?? []).filter((r) => filter === 'all' || (filter === 'site' ? SITE_TYPES.includes(r.entity_type) : r.entity_type === filter) || r.entity_type === filter.slice(0, -1));
  return (
    <section>
      <header className="admin-head"><div><p className="admin-eyebrow">Audit trail</p><h1>Activity log</h1></div></header>
      <div className="admin-chips" role="tablist" aria-label="Filter activity">
        {FILTERS.map(([k, l]) => <button key={k} role="tab" aria-selected={filter === k} className={filter === k ? 'is-active' : ''} onClick={() => setFilter(k)}>{l}</button>)}
      </div>
      <div className="admin-panel">
        {rows === null ? <div className="admin-skeleton" /> : shown.length ? <Timeline rows={shown} names={names} /> : <Empty title="No activity yet" hint="Changes to leads, bookings, projects, invoices and site content are recorded here permanently." />}
      </div>
    </section>
  );
}
