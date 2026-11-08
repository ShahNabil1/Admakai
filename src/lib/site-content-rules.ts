// Browser-safe validation shared by the admin editors and the server save functions.
import { z } from 'zod';

const slug = z.string().trim().min(1, 'Add a URL slug.').max(120).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens.');
const line = (max: number) => z.string().trim().min(1).max(max);
const list = (max: number, each: number) => z.array(line(each)).max(max);
const price = z.number({ invalid_type_error: 'Enter a price.' }).finite().min(0, 'Prices cannot be negative.').max(10_000_000);
const optionalText = (max: number) => z.string().trim().max(max).transform(v => v || null).nullable();

export const PRICING_MODELS = ['quote', 'per-minute', 'monthly'] as const;
export const serviceValuesSchema = z.object({
  slug,
  name: line(160),
  category: slug,
  short_description: z.string().trim().max(600),
  full_description: z.string().trim().max(8000),
  deliverables: list(30, 300),
  process_steps: z.array(z.object({ name: line(80), line: z.string().trim().max(300), chips: list(8, 60) })).max(12),
  faqs: z.array(z.object({ question: line(200), answer: line(1500) })).max(20),
  price_min: price,
  price_max: price,
  price_unit: line(60),
  pricing_model: z.enum(PRICING_MODELS),
  is_published: z.boolean(),
  is_featured: z.boolean(),
  is_new: z.boolean(),
  seo_title: optionalText(160),
  seo_description: optionalText(320),
  best_for: list(20, 200),
  signs_you_need_it: list(20, 300),
  what_we_need: list(20, 300),
  formats: z.string().trim().max(200),
  delivery: z.string().trim().max(120),
  goals: list(20, 40),
  related: z.array(slug).max(10),
  compare_note: optionalText(600),
  hero_title: z.object({ lead: z.string().max(120), accent: z.string().max(120), rest: z.string().max(120) }),
}).refine(v => v.price_max >= v.price_min, { path: ['price_max'], message: 'The highest price must be at least the lowest price.' })
  .refine(v => !v.related.includes(v.slug), { path: ['related'], message: 'A service cannot be related to itself.' });
export type ServiceValues = z.infer<typeof serviceValuesSchema>;

export const planValuesSchema = z.object({
  slug: slug.max(80),
  name: line(120),
  tagline: z.string().trim().max(200),
  badge: z.string().trim().max(60),
  is_highlighted: z.boolean(),
  price_min: price,
  price_max: price,
  videos: z.number().int().min(0).max(1000),
  statics: z.number().int().min(0).max(1000),
  revision_rounds: z.number().int().min(0).max(20),
  turnaround_days: z.number().int().min(0).max(90),
  turnaround: z.string().trim().max(80),
  calls: z.string().trim().max(80),
  features: list(20, 200),
  cta_text: line(60),
  is_published: z.boolean(),
}).refine(v => v.price_max >= v.price_min, { path: ['price_max'], message: 'The highest price must be at least the lowest price.' });
export type PlanValues = z.infer<typeof planValuesSchema>;

export const categoryValuesSchema = z.object({ slug: slug.max(80), name: line(120), intro: z.string().trim().max(400) });
export type CategoryValues = z.infer<typeof categoryValuesSchema>;

export const reorderSchema = z.object({ kind: z.enum(['services', 'plans', 'service_categories']), ids: z.array(z.string().uuid()).min(1).max(500) });

/** Moves one item to a new index; used by drag to reorder. */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

/** Turns database save errors into messages editors can act on; anything else stays generic. */
export function siteContentErrorMessage(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return 'This change could not be saved. Please try again.';
  if (error.code === '23505') return 'That URL slug is already used. Choose another.';
  if (error.code === '23503') return 'That category is still used by a service, or no longer exists.';
  if (error.code === '42501') return 'Only owners and hiring admins can edit site content.';
  if (error.code === '23514') return 'One of the values is outside the allowed range.';
  return 'This change could not be saved. Please try again.';
}
