// Pure helpers for the Site content editors: form values from rows, dirty checks and price previews.
import { formatCurrencyRange } from './currency-rules';
import type { CurrencyCode } from '@/data/fallbackRates';
import type { PlanValues, ServiceValues } from './site-content-rules';
import type { PlanRow, ServiceRow } from './site-content';

const strings = (v: unknown): string[] => Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
const record = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {}) as Record<string, unknown>;
const text = (v: unknown) => typeof v === 'string' ? v : '';

export function serviceValuesFromRow(row: ServiceRow): ServiceValues {
  const hero = record(row.hero_title);
  return {
    slug: row.slug, name: row.name, category: row.category,
    short_description: row.short_description, full_description: row.full_description,
    deliverables: strings(row.deliverables),
    process_steps: (Array.isArray(row.process_steps) ? row.process_steps : []).map(step => { const s = record(step); return { name: text(s['name']), line: text(s['line']), chips: strings(s['chips']) }; }),
    faqs: (Array.isArray(row.faqs) ? row.faqs : []).map(item => { const f = record(item); return { question: text(f['question']), answer: text(f['answer']) }; }),
    price_min: Number(row.price_min), price_max: Number(row.price_max), price_unit: row.price_unit,
    pricing_model: row.pricing_model === 'per-minute' || row.pricing_model === 'monthly' ? row.pricing_model : 'quote',
    is_published: row.is_published, is_featured: row.is_featured, is_new: row.is_new,
    seo_title: row.seo_title, seo_description: row.seo_description,
    best_for: strings(row.best_for), signs_you_need_it: strings(row.signs_you_need_it), what_we_need: strings(row.what_we_need),
    formats: row.formats, delivery: row.delivery, goals: strings(row.goals), related: strings(row.related),
    compare_note: row.compare_note,
    hero_title: { lead: text(hero['lead']), accent: text(hero['accent']), rest: text(hero['rest']) },
  };
}
export function emptyServiceValues(category: string): ServiceValues {
  return {
    slug: '', name: '', category, short_description: '', full_description: '', deliverables: [], process_steps: [], faqs: [],
    price_min: 0, price_max: 0, price_unit: 'project', pricing_model: 'quote', is_published: false, is_featured: false, is_new: true,
    seo_title: null, seo_description: null, best_for: [], signs_you_need_it: [], what_we_need: [], formats: '', delivery: '',
    goals: [], related: [], compare_note: null, hero_title: { lead: '', accent: '', rest: '' },
  };
}
export function planValuesFromRow(row: PlanRow): PlanValues {
  return {
    slug: row.slug, name: row.name, tagline: row.tagline, badge: row.badge, is_highlighted: row.is_highlighted,
    price_min: Number(row.price_min), price_max: Number(row.price_max), videos: row.videos, statics: row.statics,
    revision_rounds: row.revision_rounds, turnaround_days: row.turnaround_days, turnaround: row.turnaround, calls: row.calls,
    features: strings(row.features), cta_text: row.cta_text, is_published: row.is_published,
  };
}
export function emptyPlanValues(): PlanValues {
  return { slug: '', name: '', tagline: '', badge: '', is_highlighted: false, price_min: 0, price_max: 0, videos: 0, statics: 0, revision_rounds: 2, turnaround_days: 5, turnaround: '', calls: '', features: [], cta_text: 'Start with a call', is_published: false };
}

/** Key-order independent comparison so re-ordered objects never count as unsaved changes. */
export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${stableJson((value as Record<string, unknown>)[k])}`).join(',')}}`;
  return JSON.stringify(value ?? null);
}
export const isDirty = (current: unknown, saved: unknown) => stableJson(current) !== stableJson(saved);

/** The exact public service price line ("Estimated price: $290 to $440", plus " per unit" unless project). */
export function servicePriceLine(min: number, max: number, unit: string, currency: CurrencyCode = 'USD', rate?: number) {
  const range = rate === undefined ? formatCurrencyRange(min, max, currency) : formatCurrencyRange(min, max, currency, rate);
  return `Estimated price: ${range}${unit !== 'project' ? ` per ${unit}` : ''}`;
}
export function planPriceLine(min: number, max: number, currency: CurrencyCode = 'USD', rate?: number) {
  return `${rate === undefined ? formatCurrencyRange(min, max, currency) : formatCurrencyRange(min, max, currency, rate)}/month`;
}
/** Suggested slug from a name: lowercase words joined by single hyphens. */
export function slugify(name: string) {
  return name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
}
