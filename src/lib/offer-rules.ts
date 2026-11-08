// Browser-safe offer rules: liveness, winning offer, discounted ranges, dates and presets. Base prices are never changed.
import type { CurrencyCode } from '@/data/fallbackRates';
import { convertRange, roundingStep } from './currency-rules';

export const OFFER_PRESETS = ['black_friday', 'eid', 'puja', 'pohela_boishakh', 'new_year', 'stock_out', 'flash_sale', 'always_on', 'custom'] as const;
export type OfferPreset = typeof OFFER_PRESETS[number];
export const OFFER_SCOPES = ['everything', 'services', 'plans', 'selected'] as const;
export type OfferScope = typeof OFFER_SCOPES[number];
export type OfferTheme = { background: string; text: string; accent: string; badge: string };
export type OfferDecor = 'none' | 'crescent' | 'pulse';

/** Public shape of a live offer; selected items are resolved to service and plan slugs. */
export type PublicOffer = {
  id: string; slug: string; preset: OfferPreset; headline: string; shortBadge: string; discountPercent: number;
  appliesTo: OfferScope; serviceSlugs: string[]; planSlugs: string[];
  startsAt: string; endsAt: string | null; isActive: boolean; priority: number;
  showBar: boolean; showCountdown: boolean; ctaText: string; ctaLink: string; theme: OfferTheme;
};

export const DEFAULT_THEME: OfferTheme = { background: '#0B0B0C', text: '#FFFFFF', accent: '#FFD43B', badge: '#FFD43B' };

type PresetInfo = { label: string; theme: OfferTheme; decor: OfferDecor; headline: (p: number) => string; badge: (p: number) => string };
export const PRESETS: Record<OfferPreset, PresetInfo> = {
  black_friday: { label: 'Black Friday', theme: DEFAULT_THEME, decor: 'none', headline: p => `Black Friday: ${p}% off every service`, badge: p => `Black Friday ${p}% off` },
  eid: { label: 'Eid', theme: { background: '#0F3D2E', text: '#F7F1E1', accent: '#D9B86C', badge: '#D9B86C' }, decor: 'crescent', headline: p => `Eid Mubarak: ${p}% off every service`, badge: p => `Eid ${p}% off` },
  puja: { label: 'Puja', theme: { background: '#7A0E16', text: '#FFF4E8', accent: '#FF8A2A', badge: '#FF8A2A' }, decor: 'none', headline: p => `Puja special: ${p}% off every service`, badge: p => `Puja ${p}% off` },
  pohela_boishakh: { label: 'Pohela Boishakh', theme: { background: '#FFFFFF', text: '#111111', accent: '#D7262B', badge: '#D7262B' }, decor: 'none', headline: p => `Shubho Noboborsho: ${p}% off every service`, badge: p => `Boishakh ${p}% off` },
  new_year: { label: 'New Year', theme: { background: '#0E1A3A', text: '#F2F4F8', accent: '#C9CED6', badge: '#C9CED6' }, decor: 'none', headline: p => `New Year: ${p}% off every service`, badge: p => `New Year ${p}% off` },
  stock_out: { label: 'Stock out', theme: { background: '#D7262B', text: '#FFFFFF', accent: '#FFFFFF', badge: '#FFFFFF' }, decor: 'pulse', headline: p => `Only a few slots left: ${p}% off`, badge: p => `${p}% off · Few slots left` },
  flash_sale: { label: 'Flash sale', theme: { background: '#D7262B', text: '#FFFFFF', accent: '#FFFFFF', badge: '#FFFFFF' }, decor: 'pulse', headline: p => `Flash sale: ${p}% off. Only a few slots left`, badge: p => `Flash sale ${p}% off` },
  always_on: { label: 'Always on', theme: DEFAULT_THEME, decor: 'none', headline: p => `Save ${p}% on every service`, badge: p => `${p}% off` },
  custom: { label: 'Custom', theme: DEFAULT_THEME, decor: 'none', headline: p => `Save ${p}% on every service`, badge: p => `${p}% off` },
};
export const isPreset = (v: unknown): v is OfferPreset => OFFER_PRESETS.some(p => p === v);
export const isScope = (v: unknown): v is OfferScope => OFFER_SCOPES.some(s => s === v);

const HEX = /^#[0-9A-Fa-f]{6}$/;
export function safeTheme(value: unknown, preset: OfferPreset = 'custom'): OfferTheme {
  const base = PRESETS[preset].theme;
  const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const pick = (k: keyof OfferTheme) => typeof v[k] === 'string' && HEX.test(v[k] as string) ? (v[k] as string) : base[k];
  return { background: pick('background'), text: pick('text'), accent: pick('accent'), badge: pick('badge') };
}
/** Black or white text, whichever reads better on the colour. */
export function readableOn(hex: string) {
  if (!HEX.test(hex)) return '#111111';
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(x => x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4);
  const l = .2126 * c[0]! + .7152 * c[1]! + .0722 * c[2]!;
  return l > .45 ? '#111111' : '#FFFFFF';
}
/** Only same-site paths are allowed as offer buttons. */
export function safeCtaLink(link: string) { return /^\/(?!\/)[A-Za-z0-9/_?=&.#%+-]*$/.test(link) ? link : '/pricing'; }

const ms = (iso: string | null) => iso ? new Date(iso).getTime() : NaN;
export function isOfferLive(o: Pick<PublicOffer, 'isActive' | 'startsAt' | 'endsAt'>, now: number) {
  return o.isActive && ms(o.startsAt) <= now && (o.endsAt === null || ms(o.endsAt) > now);
}
export type OfferStatus = 'off' | 'scheduled' | 'live' | 'ended';
export function offerStatus(o: Pick<PublicOffer, 'isActive' | 'startsAt' | 'endsAt'>, now: number): OfferStatus {
  if (o.endsAt !== null && ms(o.endsAt) <= now) return 'ended';
  if (!o.isActive) return 'off';
  return ms(o.startsAt) > now ? 'scheduled' : 'live';
}
export type PriceKind = 'service' | 'plan';
export function offerCovers(o: Pick<PublicOffer, 'appliesTo' | 'serviceSlugs' | 'planSlugs'>, kind: PriceKind, slug: string) {
  if (o.appliesTo === 'everything') return true;
  if (o.appliesTo === 'services') return kind === 'service';
  if (o.appliesTo === 'plans') return kind === 'plan';
  return (kind === 'service' ? o.serviceSlugs : o.planSlugs).includes(slug);
}
/** Higher priority wins; ties go to the newer start, then a stable id order. Offers never stack. */
export function compareOffers(a: Pick<PublicOffer, 'priority' | 'startsAt' | 'id'>, b: Pick<PublicOffer, 'priority' | 'startsAt' | 'id'>) {
  return b.priority - a.priority || ms(b.startsAt) - ms(a.startsAt) || a.id.localeCompare(b.id);
}
export function winningOffer<T extends PublicOffer>(offers: T[], kind: PriceKind, slug: string, now: number): T | null {
  return offers.filter(o => isOfferLive(o, now) && offerCovers(o, kind, slug)).sort(compareOffers)[0] ?? null;
}
export function barOffer<T extends PublicOffer>(offers: T[], now: number): T | null {
  return offers.filter(o => o.showBar && isOfferLive(o, now)).sort(compareOffers)[0] ?? null;
}
export function featuredOffer<T extends PublicOffer>(offers: T[], now: number): T | null {
  return barOffer(offers, now) ?? offers.filter(o => isOfferLive(o, now)).sort(compareOffers)[0] ?? null;
}

/** Discount both ends. BDT rounds to the nearest 50; other currencies keep their usual rounding. */
export function discountedRange(minUsd: number, maxUsd: number, percent: number, currency: CurrencyCode, rate: number) {
  const factor = 1 - Math.min(90, Math.max(0, percent)) / 100;
  if (currency === 'BDT') {
    const round = (v: number) => Math.max(50, Math.round(v / 50) * 50);
    const min = round(minUsd * rate * factor);
    return { min, max: Math.max(min, round(maxUsd * rate * factor)) };
  }
  const r = convertRange(minUsd * factor, maxUsd * factor, currency, rate);
  const step = roundingStep(currency);
  const min = Math.max(step, r.min);
  return { min, max: Math.max(min, r.max) };
}
export function formatAmount(amount: number, currency: CurrencyCode) {
  if (currency === 'BDT') return `৳${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)}`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: 'narrowSymbol', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}
export const formatAmountRange = (r: { min: number; max: number }, currency: CurrencyCode) => r.min === r.max ? formatAmount(r.min, currency) : `${formatAmount(r.min, currency)} to ${formatAmount(r.max, currency)}`;
/** Savings range between the displayed original and discounted amounts. */
export function savingsRange(original: { min: number; max: number }, discounted: { min: number; max: number }) {
  const a = Math.max(0, original.min - discounted.min), b = Math.max(0, original.max - discounted.max);
  return { min: Math.min(a, b), max: Math.max(a, b) };
}

const dhakaDate = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short' });
export function offerEndLabel(endsAt: string | null) { return endsAt ? `Offer ends ${dhakaDate.format(new Date(endsAt))}` : 'Limited time'; }

export type Countdown = { days: number; hours: number; minutes: number; seconds: number };
export function countdown(endsAt: string | null, now: number): Countdown | null {
  if (!endsAt) return null;
  const left = Math.max(0, Math.floor((ms(endsAt) - now) / 1000));
  return { days: Math.floor(left / 86400), hours: Math.floor(left / 3600) % 24, minutes: Math.floor(left / 60) % 60, seconds: left % 60 };
}
export const pad2 = (n: number) => String(n).padStart(2, '0');

/** Dhaka is UTC+6 all year (no daylight saving). */
export function dhakaInputToIso(local: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return null;
  const d = new Date(`${local}:00+06:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
export function isoToDhakaInput(iso: string | null) {
  if (!iso) return '';
  const d = new Date(new Date(iso).getTime() + 6 * 3600_000);
  return d.toISOString().slice(0, 16);
}

/** Admin warnings: switched-on offers whose dates and items overlap; names the one that wins. */
export type OverlapOffer = Pick<PublicOffer, 'id' | 'priority' | 'startsAt' | 'endsAt' | 'isActive' | 'appliesTo' | 'serviceSlugs' | 'planSlugs'> & { name: string };
function coversAny(a: OverlapOffer, b: OverlapOffer) {
  const services = (o: OverlapOffer) => o.appliesTo === 'everything' || o.appliesTo === 'services' ? '*' : o.appliesTo === 'selected' ? o.serviceSlugs : [];
  const plans = (o: OverlapOffer) => o.appliesTo === 'everything' || o.appliesTo === 'plans' ? '*' : o.appliesTo === 'selected' ? o.planSlugs : [];
  const meet = (x: '*' | string[], y: '*' | string[]) => (x === '*' && (y === '*' || y.length > 0)) || (y === '*' && x.length > 0) || (x !== '*' && y !== '*' && x.some(s => y.includes(s)));
  return meet(services(a), services(b)) || meet(plans(a), plans(b));
}
export function overlapWarnings(offers: OverlapOffer[], now: number) {
  const on = offers.filter(o => o.isActive && (o.endsAt === null || ms(o.endsAt) > now));
  const out: { a: string; b: string; winner: string; text: string }[] = [];
  for (let i = 0; i < on.length; i++) for (let j = i + 1; j < on.length; j++) {
    const a = on[i]!, b = on[j]!;
    const timeOverlap = ms(a.startsAt) < (b.endsAt ? ms(b.endsAt) : Infinity) && ms(b.startsAt) < (a.endsAt ? ms(a.endsAt) : Infinity);
    if (!timeOverlap || !coversAny(a, b)) continue;
    const winner = compareOffers(a, b) <= 0 ? a : b;
    out.push({ a: a.id, b: b.id, winner: winner.id, text: `${a.name} and ${b.name} overlap on the same items. ${winner.name} wins (${a.priority === b.priority ? 'same priority, newer start' : 'higher priority'}); offers never stack.` });
  }
  return out;
}

export const DISMISS_KEY = 'admakai-offer-dismissed';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function parseDismissed(raw: string | null): string[] {
  try { const v = JSON.parse(raw ?? '[]'); return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && UUID.test(x)).slice(-20) : []; } catch { return []; }
}
