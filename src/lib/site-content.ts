// Browser-safe catalogue layer: maps database rows to the exact static shapes and swaps the live lists in place.
import { services, serviceCategories, type Service, type ServiceCategory, type HeroMedia, type ProcessStep, type ServiceFaq } from '@/data/services';
import { plans, type MonthlyPlan } from '@/data/plans';
import type { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];
export type ServiceRow = Tables['services']['Row'];
export type PlanRow = Tables['plans']['Row'];
export type CategoryRow = Tables['service_categories']['Row'];
export type Catalogue = { services: Service[]; categories: ServiceCategory[]; plans: MonthlyPlan[]; source: 'database' | 'static' };

// Snapshot taken before any database data is applied: the emergency fallback when the database is unreachable.
const staticSnapshot: Catalogue = JSON.parse(JSON.stringify({ services, categories: serviceCategories, plans, source: 'static' }));
export function staticCatalogue(): Catalogue { return JSON.parse(JSON.stringify(staticSnapshot)); }

const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
function heroTitle(value: unknown): Service['heroTitle'] {
  const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  return { lead: typeof v['lead'] === 'string' ? v['lead'] : '', accent: typeof v['accent'] === 'string' ? v['accent'] : '', rest: typeof v['rest'] === 'string' ? v['rest'] : '' };
}
function processSteps(value: unknown): ProcessStep[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    const v = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    return typeof v['name'] === 'string' && v['name'].trim() ? [{ name: v['name'], line: typeof v['line'] === 'string' ? v['line'] : '', chips: strings(v['chips']) }] : [];
  });
}
function faqs(value: unknown): ServiceFaq[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    const v = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    return typeof v['question'] === 'string' && v['question'].trim() && typeof v['answer'] === 'string' ? [{ question: v['question'], answer: v['answer'] }] : [];
  });
}
const pricingModels = ['quote', 'per-minute', 'monthly'] as const;

/** Builds the Service object exactly as the static file wrote it; optional keys appear only when set. */
export function rowToService(row: ServiceRow): Service {
  const service: Service = {
    slug: row.slug, category: row.category, name: row.name, isNew: row.is_new, published: row.is_published,
    shortDescription: row.short_description, description: row.full_description,
    bestFor: strings(row.best_for), signsYouNeedIt: strings(row.signs_you_need_it), whatYouGet: strings(row.deliverables), whatWeNeed: strings(row.what_we_need),
    formats: row.formats, delivery: row.delivery,
    pricing: (pricingModels as readonly string[]).includes(row.pricing_model) ? row.pricing_model as Service['pricing'] : 'quote',
    priceMinUsd: Number(row.price_min), priceMaxUsd: Number(row.price_max), priceUnit: row.price_unit,
    goals: strings(row.goals), related: strings(row.related), heroTitle: heroTitle(row.hero_title),
  };
  if (row.compare_note) service.compareNote = row.compare_note;
  if (row.is_featured) service.featured = true;
  if (row.hero_media && typeof row.hero_media === 'object') service.heroMedia = row.hero_media as unknown as { reels: HeroMedia[]; sides: HeroMedia[] };
  if (row.seo_title) service.seoTitle = row.seo_title;
  if (row.seo_description) service.seoDescription = row.seo_description;
  const steps = processSteps(row.process_steps); if (steps.length) service.processSteps = steps;
  const list = faqs(row.faqs); if (list.length) service.faqs = list;
  return service;
}
export function rowToCategory(row: CategoryRow): ServiceCategory { return { id: row.slug, name: row.name, intro: row.intro }; }
export function rowToPlan(row: PlanRow): MonthlyPlan {
  return {
    id: row.slug, slug: row.slug, name: row.name, forLine: row.tagline, badge: row.badge,
    videos: row.videos, statics: row.statics, revisionRounds: row.revision_rounds, turnaroundDays: row.turnaround_days,
    turnaround: row.turnaround, calls: row.calls, priceMinUsd: Number(row.price_min), priceMaxUsd: Number(row.price_max),
    isHighlighted: row.is_highlighted, ctaText: row.cta_text, features: strings(row.features),
  };
}
const bySort = <T extends { sort_order: number; slug: string }>(a: T, b: T) => a.sort_order - b.sort_order || a.slug.localeCompare(b.slug);
export function catalogueFromRows(rows: { services: ServiceRow[]; categories: CategoryRow[]; plans: PlanRow[] }): Catalogue {
  return {
    services: [...rows.services].sort(bySort).map(rowToService),
    categories: [...rows.categories].sort(bySort).map(rowToCategory),
    plans: [...rows.plans].sort(bySort).map(rowToPlan),
    source: 'database',
  };
}

let appliedKey = '';
/** Replaces the shared service, category and plan lists in place so every existing helper reads the same data. */
export function applyCatalogue(next: Catalogue) {
  const key = JSON.stringify(next);
  if (key === appliedKey) return;
  appliedKey = key;
  services.splice(0, services.length, ...next.services);
  serviceCategories.splice(0, serviceCategories.length, ...next.categories);
  plans.splice(0, plans.length, ...next.plans);
}
