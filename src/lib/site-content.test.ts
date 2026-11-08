import { describe, expect, it } from 'vitest';
import { services, serviceCategories } from '@/data/services';
import { plans, planInclusions } from '@/data/plans';
import { applyCatalogue, catalogueFromRows, rowToPlan, rowToService, staticCatalogue, type PlanRow, type ServiceRow } from './site-content';
import { isDirty, planPriceLine, servicePriceLine, serviceValuesFromRow, slugify } from './site-content-editor';
import { moveItem, planValuesSchema, serviceValuesSchema, siteContentErrorMessage } from './site-content-rules';

const serviceRow = (over: Partial<ServiceRow> = {}): ServiceRow => ({
  id: '00000000-0000-4000-8000-000000000001', slug: 'ai-commercial-30s', name: 'AI Commercial, 30s', category: 'video-ads',
  short_description: 'Short', full_description: 'Long', deliverables: ['A'], process_steps: [], faqs: [],
  price_min: 290, price_max: 440, price_unit: 'project', base_currency: 'USD', pricing_model: 'quote',
  is_published: true, is_featured: true, is_new: false, sort_order: 1, seo_title: null, seo_description: null,
  best_for: [], signs_you_need_it: [], what_we_need: [], formats: '16:9', delivery: '7 days', goals: [], related: [],
  compare_note: null, hero_title: { lead: 'Your next TV ad,', accent: 'shoot-free', rest: 'in 7 days.' }, hero_media: null,
  created_at: '2026-11-08T00:00:00Z', updated_at: '2026-11-08T00:00:00Z', ...over,
});
const planRow = (over: Partial<PlanRow> = {}): PlanRow => ({
  id: '00000000-0000-4000-8000-000000000002', slug: 'growth', name: 'Growth', tagline: 'A brand running paid ads', badge: 'Most picked',
  is_highlighted: true, price_min: 550, price_max: 950, base_currency: 'USD', billing_period: 'month', videos: 8, statics: 16,
  revision_rounds: 2, turnaround_days: 5, turnaround: 'First cut in 5 days', calls: 'Two calls a month', features: [],
  cta_text: 'Start with a call', is_published: true, sort_order: 2, created_at: '2026-11-08T00:00:00Z', updated_at: '2026-11-08T00:00:00Z', ...over,
});

describe('Database rows keep the exact public shapes', () => {
  it('maps a service row to the same object the static catalogue used', () => {
    const original = staticCatalogue().services.find(s => s.slug === 'ai-commercial-30s');
    const mapped = rowToService(serviceRow({ short_description: original?.shortDescription ?? '', full_description: original?.description ?? '', deliverables: original?.whatYouGet ?? [], best_for: original?.bestFor ?? [], signs_you_need_it: original?.signsYouNeedIt ?? [], what_we_need: original?.whatWeNeed ?? [], formats: original?.formats ?? '', goals: original?.goals ?? [], related: original?.related ?? [] }));
    expect(mapped).toEqual(original);
  });
  it('keeps USD prices exactly as stored', () => {
    expect(rowToService(serviceRow({ price_min: 290, price_max: 440 }))).toMatchObject({ priceMinUsd: 290, priceMaxUsd: 440 });
  });
  it('maps the Growth plan with its range, highlight and button text', () => {
    expect(rowToPlan(planRow())).toEqual({ ...staticCatalogue().plans[1] });
  });
  it('uses edited features instead of the standard inclusion list', () => {
    expect(planInclusions(rowToPlan(planRow({ features: ['Custom line'] })))).toEqual(['Custom line']);
  });
  it('sorts by display order', () => {
    const c = catalogueFromRows({ services: [serviceRow({ slug: 'b', sort_order: 2 }), serviceRow({ slug: 'a', sort_order: 1 })], categories: [], plans: [] });
    expect(c.services.map(s => s.slug)).toEqual(['a', 'b']);
  });
});

describe('Applying the live catalogue', () => {
  it('replaces the shared lists in place and the static fallback stays intact', () => {
    const fallback = staticCatalogue();
    applyCatalogue({ services: [rowToService(serviceRow({ price_min: 300 }))], categories: fallback.categories, plans: [rowToPlan(planRow({ price_min: 600 }))], source: 'database' });
    expect(services).toHaveLength(1);
    expect(services[0]?.priceMinUsd).toBe(300);
    expect(plans[0]?.priceMinUsd).toBe(600);
    expect(staticCatalogue().services).toHaveLength(37);
    applyCatalogue(fallback);
    expect(services).toHaveLength(37);
    expect(serviceCategories).toHaveLength(6);
    expect(plans.map(p => p.priceMinUsd)).toEqual([320, 550, 1010]);
  });
  it('hides unpublished services because the public read returns only published rows', () => {
    const fallback = staticCatalogue();
    applyCatalogue({ ...fallback, services: fallback.services.filter(s => s.slug !== 'ai-ugc-ads'), source: 'database' });
    expect(services.some(s => s.slug === 'ai-ugc-ads')).toBe(false);
    applyCatalogue(fallback);
  });
});

describe('Editor rules', () => {
  const values = serviceValuesFromRow(serviceRow());
  it('rejects a highest price below the lowest price', () => {
    expect(serviceValuesSchema.safeParse({ ...values, price_min: 500, price_max: 400 }).success).toBe(false);
    expect(planValuesSchema.safeParse({ slug: 'x', name: 'X', tagline: '', badge: '', is_highlighted: false, price_min: 10, price_max: 5, videos: 1, statics: 1, revision_rounds: 1, turnaround_days: 1, turnaround: '', calls: '', features: [], cta_text: 'Go', is_published: true }).success).toBe(false);
  });
  it('rejects a service related to itself', () => {
    expect(serviceValuesSchema.safeParse({ ...values, related: ['ai-commercial-30s'] }).success).toBe(false);
  });
  it('treats key order as unchanged and value edits as unsaved', () => {
    expect(isDirty({ a: 1, b: [1] }, { b: [1], a: 1 })).toBe(false);
    expect(isDirty({ price_min: 290 }, { price_min: 300 })).toBe(true);
  });
  it('previews the site price line in USD and BDT', () => {
    expect(servicePriceLine(290, 440, 'project')).toBe('Estimated price: $290 to $440');
    expect(servicePriceLine(50, 85, 'product')).toBe('Estimated price: $50 to $85 per product');
    expect(servicePriceLine(290, 440, 'project', 'BDT', 123)).toBe('Estimated price: ৳35,500 to ৳54,500');
    expect(planPriceLine(550, 950)).toBe('$550 to $950/month');
  });
  it('moves an item for drag to reorder', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
  });
  it('explains duplicate slugs and permission errors', () => {
    expect(siteContentErrorMessage({ code: '23505' })).toBe('That URL slug is already used. Choose another.');
    expect(siteContentErrorMessage({ code: '42501' })).toBe('Only owners and hiring admins can edit site content.');
  });
  it('suggests clean slugs', () => {
    expect(slugify('AI Commercial, 30s')).toBe('ai-commercial-30s');
  });
});

describe('Site content history', () => {
  it('describes a price edit in plain words', async () => {
    const { describeActivity } = await import('./activity');
    expect(describeActivity({ entity_type: 'services', verb: 'updated', from_value: '290.00 to 440.00', to_value: '290.00 to 445.00', meta: { title: 'AI Commercial, 30s', fields: ['price_max'] } }))
      .toBe('Service “AI Commercial, 30s” updated: price $290 to $440 → $290 to $445 (price max)');
  });
});
