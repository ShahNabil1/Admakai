import { supabase } from '@/lib/supabase';
import { visitorId } from '@/lib/work-feedback';
import { HEARTBEAT_SECS, browserFrom, clickLabel, continuesSession, deviceFrom, externalHost } from './analytics-rules';

type Kind = 'page_view' | 'heartbeat' | 'click' | 'scroll' | 'booking_step' | 'enquiry';
type Payload = Record<string, string | number | boolean | null>;

let queue: Payload[] = [];
let started = false;
let currentPath = '/';
let maxScroll = 0;
let lastScrollSent = 0;

function sessionId(): string {
  const key = 'admakai-session';
  const now = Date.now();
  let raw: { id: string; at: number } | null = null;
  try { raw = JSON.parse(localStorage.getItem(key) ?? 'null'); } catch { raw = null; }
  const id = raw && continuesSession(raw.at, now) ? raw.id : crypto.randomUUID();
  localStorage.setItem(key, JSON.stringify({ id, at: now }));
  return id;
}

export function analyticsIds() { return { visitor: visitorId(), session: sessionId() }; }

function flush() {
  if (!queue.length) return;
  const batch = queue.slice(0, 60);
  queue = queue.slice(60);
  void supabase.rpc('track_events', { _events: batch }).then(() => undefined, () => undefined);
}

/** Queue one event; page views carry source and device details. */
export function track(kind: Kind, extra: { label?: string | null; value?: number; path?: string } = {}) {
  if (typeof window === 'undefined') return;
  const { visitor, session } = analyticsIds();
  queue.push({ v: visitor, s: session, k: kind, p: extra.path ?? currentPath, l: extra.label ?? null, n: extra.value ?? null });
  if (queue.length >= 20) flush();
}

function pageView(path: string) {
  if (path.startsWith('/admin')) return;
  if (maxScroll > 0) track('scroll', { value: maxScroll });
  currentPath = path; maxScroll = 0; lastScrollSent = 0;
  const { visitor, session } = analyticsIds();
  const firstKey = 'admakai-seen';
  const isNew = !localStorage.getItem(firstKey);
  if (isNew) localStorage.setItem(firstKey, '1');
  const url = new URL(window.location.href);
  const ua = navigator.userAgent;
  queue.push({
    v: visitor, s: session, k: 'page_view', p: path,
    r: externalHost(document.referrer, window.location.hostname),
    us: url.searchParams.get('utm_source'), um: url.searchParams.get('utm_medium'), uc: url.searchParams.get('utm_campaign'),
    d: deviceFrom(ua), b: browserFrom(ua), tz: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null, new: isNew,
  });
  flush();
}

/** Called once from the public layout; returns a function for route changes. */
export function startTracking(): (path: string) => void {
  if (!started) {
    started = true;
    window.setInterval(() => { if (document.visibilityState === 'visible') track('heartbeat', { value: HEARTBEAT_SECS }); }, HEARTBEAT_SECS * 1000);
    window.setInterval(flush, 10_000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { if (maxScroll > lastScrollSent) { track('scroll', { value: maxScroll }); lastScrollSent = maxScroll; } flush(); } });
    window.addEventListener('scroll', () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const depth = h > 0 ? Math.min(100, Math.round((window.scrollY / h) * 100)) : 100;
      if (depth > maxScroll) maxScroll = depth;
    }, { passive: true });
    document.addEventListener('click', (event) => {
      const el = (event.target as Element | null)?.closest?.('a, button, [data-track]');
      if (!el || el.closest('form input, form textarea')) return;
      const label = clickLabel({ tag: el.tagName.toLowerCase(), track: el.getAttribute('data-track'), aria: el.getAttribute('aria-label'), text: el.textContent });
      if (label) track('click', { label });
    }, { capture: true });
  }
  let last = '';
  return (path: string) => { if (path !== last) { last = path; pageView(path); } };
}

/** Saves what a visitor typed in the booking form so the team can follow up if they leave. */
export function saveBookingDraft(id: string, f: { name: string; email: string; whatsapp: string; brand: string }, interest: string, step: number) {
  const { visitor, session } = analyticsIds();
  void supabase.rpc('save_booking_draft', { _id: id, _visitor: visitor, _session: session, _name: f.name, _email: f.email, _whatsapp: f.whatsapp, _brand: f.brand, _interest: interest, _step: step }).then(() => undefined, () => undefined);
}

export function completeBookingDraft(id: string) {
  void supabase.rpc('complete_booking_draft', { _id: id, _visitor: visitorId() }).then(() => undefined, () => undefined);
}
