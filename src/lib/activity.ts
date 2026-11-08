export type ActivityRow = { id?: string; entity_type: string; entity_id?: string; verb: string; from_value: string | null; to_value: string | null; meta: Record<string, unknown> | null; created_at?: string; actor_id?: string | null };

const NOUN: Record<string, string> = { leads: 'Lead', lead: 'Lead', bookings: 'Booking', booking: 'Booking', projects: 'Project', tasks: 'Task', deliverables: 'Deliverable', invoices: 'Invoice', payments: 'Payment', clients: 'Client', services: 'Service', plans: 'Plan', service_categories: 'Service category' };
const SITE_CONTENT = new Set(['services', 'plans', 'service_categories']);
const money = (v: string | null) => (v ?? '').replace(/(\d+)(?:\.00)?/g, (_, n: string) => `$${Number(n).toLocaleString('en-US')}`);
const human = (v: string | null) => (v ?? 'Not supplied').replace(/_/g, ' ');

export function describeActivity(a: ActivityRow): string {
  const noun = NOUN[a.entity_type] ?? a.entity_type;
  const title = typeof a.meta?.['title'] === 'string' && a.meta['title'] ? ` “${a.meta['title']}”` : '';
  if (a.verb === 'created') return a.entity_type === 'payments' ? `Payment of ${title.replace(/[“”]/g, '').trim()} recorded` : `${noun}${title} created`;
  if (SITE_CONTENT.has(a.entity_type) && a.verb === 'updated') {
    const fields = Array.isArray(a.meta?.['fields']) ? (a.meta['fields'] as unknown[]).filter((f): f is string => typeof f === 'string').map(f => f.replace(/_/g, ' ')) : [];
    const price = a.from_value && a.to_value && a.from_value !== a.to_value ? `: price ${money(a.from_value)} → ${money(a.to_value)}` : '';
    return `${noun}${title} updated${price}${fields.length ? ` (${fields.join(', ')})` : ''}`;
  }
  if (a.verb.endsWith('_changed') || a.verb === 'stage_change') return `${noun}${title} moved from ${human(a.from_value)} to ${human(a.to_value)}`;
  return `${noun}${title} ${human(a.verb)}`;
}
