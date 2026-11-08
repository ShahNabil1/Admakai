/** Browser-safe helpers shared by the visitor tracker and the admin Analytics page. */

export const SESSION_IDLE_MS = 30 * 60_000;
export const HEARTBEAT_SECS = 15;

export function deviceFrom(ua: string): 'phone' | 'tablet' | 'desktop' {
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return 'tablet';
  if (/Mobi|iPhone|Android/i.test(ua)) return 'phone';
  return 'desktop';
}

export function browserFrom(ua: string): string {
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\/|Opera/.test(ua)) return 'Opera';
  if (/SamsungBrowser/.test(ua)) return 'Samsung';
  if (/FBAN|FBAV|Instagram/.test(ua)) return 'In-app';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua)) return 'Safari';
  return 'Other';
}

/** Referrer host, or null for direct visits and visits from our own site. */
export function externalHost(referrer: string, ownHost: string): string | null {
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    return host && host !== ownHost.replace(/^www\./, '') ? host : null;
  } catch { return null; }
}

/** A session continues while the visitor was active within the idle window. */
export function continuesSession(lastActive: number | null, now: number): boolean {
  return lastActive !== null && now - lastActive < SESSION_IDLE_MS;
}

/** Unfinished-booking details are saved once there is a way to contact the visitor. */
export function draftWorthSaving(f: { name: string; email: string; whatsapp: string }): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim()) || f.whatsapp.replace(/\D/g, '').length >= 8;
}

/** Short human label for a click target; never reads form fields. */
export function clickLabel(el: { tag: string; track?: string | null; aria?: string | null; text?: string | null }): string | null {
  if (['input', 'textarea', 'select'].includes(el.tag)) return null;
  const raw = el.track || el.aria || el.text || '';
  const label = raw.replace(/\s+/g, ' ').trim().slice(0, 60);
  return label || null;
}

export function formatDuration(secs: number): string {
  const s = Math.max(0, Math.round(secs));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function percent(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

const PAGE_NAMES: [RegExp, string][] = [
  [/^\/$/, 'Home'], [/^\/services$/, 'Services'], [/^\/services\//, 'Service detail'], [/^\/pricing$/, 'Pricing'],
  [/^\/book$/, 'Book a call'], [/^\/work$/, 'Work'], [/^\/work\//, 'Work video'], [/^\/about$/, 'About'],
  [/^\/careers$/, 'Careers'], [/^\/careers\/[^/]+\/apply/, 'Job application'], [/^\/careers\//, 'Job details'],
  [/^\/blog$/, 'Blog'], [/^\/blog\//, 'Blog post'], [/^\/privacy$/, 'Privacy'], [/^\/terms$/, 'Terms'], [/^\/refund$/, 'Refund'],
];
export function pageName(path: string): string {
  if (path === '(entry)') return 'Arrived';
  if (path === '(left)') return 'Left site';
  const hit = PAGE_NAMES.find(([re]) => re.test(path));
  return hit ? hit[1] : path;
}
