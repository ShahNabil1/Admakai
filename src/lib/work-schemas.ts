import { z } from 'zod';

export const WORK_ASPECTS = ['16:9', '9:16', '1:1', '4:5'] as const;

/** Lowercase URL slug: letters, numbers and single hyphens. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const slugField = z
  .string()
  .min(1, 'Slug is required.')
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only.');

export const caseStudySchema = z.object({
  is_sample: z.boolean().optional(),
  overview: z.string().max(4000).optional(),
  problems: z.array(z.string().max(300)).max(30).optional(),
  solutions: z.array(z.string().max(300)).max(30).optional(),
  process: z.array(z.object({ title: z.string().max(120), body: z.string().max(2000) })).max(30).optional(),
  tools: z.array(z.string().max(60)).max(30).optional(),
  deliverables: z.array(z.string().max(200)).max(30).optional(),
  result: z.string().max(4000).optional(),
  metrics: z.array(z.object({ label: z.string().max(80), value: z.string().max(80) })).max(20).optional(),
  testimonial: z
    .object({ quote: z.string().max(1000), name: z.string().max(120), role: z.string().max(120) })
    .nullable()
    .optional(),
});

/** Payload validated before a work is inserted or updated. */
export const workFormSchema = z.object({
  slug: slugField,
  title: z.string().trim().min(1, 'Title is required.').max(160),
  vimeo_id: z.string().regex(/^\d+$/, 'Enter a valid Vimeo link or ID.'),
  aspect: z.enum(WORK_ASPECTS),
  duration_sec: z.number().int().min(0).max(86400).nullable(),
  thumbnail_url: z.string().url('Enter a valid https URL.').max(500).nullable(),
  category_id: z.string().uuid().nullable(),
  client_name: z.string().max(160).nullable(),
  industry: z.string().max(120).nullable(),
  year: z.number().int().min(1990).max(2100).nullable(),
  short_description: z.string().max(300, 'Keep it under 300 characters.').nullable(),
  tags: z.array(z.string().min(1).max(40)).max(20),
  featured: z.boolean(),
  published: z.boolean(),
  sort_order: z.number().int().min(0),
  seo_title: z.string().max(160).nullable(),
  seo_description: z.string().max(300).nullable(),
  case_study: caseStudySchema,
});

export type WorkFormPayload = z.infer<typeof workFormSchema>;

export const workImportCategorySchema = z.object({
  slug: slugField,
  name: z.string().trim().min(1).max(120),
  sort_order: z.number().int().min(0).default(0),
});

export const workImportWorkSchema = z.object({
  slug: slugField,
  title: z.string().trim().min(1).max(160),
  vimeo_id: z.string().regex(/^\d+$/, 'vimeo_id must be a number.'),
  aspect: z.enum(WORK_ASPECTS),
  duration_sec: z.number().int().min(0).nullable().optional(),
  thumbnail_url: z.string().max(500).nullable().optional(),
  category_slug: z.string().nullable().optional(),
  client_name: z.string().max(160).nullable().optional(),
  industry: z.string().max(120).nullable().optional(),
  year: z.number().int().min(1990).max(2100).nullable().optional(),
  short_description: z.string().max(300).nullable().optional(),
  tags: z.array(z.string().max(40)).max(20).default([]),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
  services: z
    .array(z.object({ service_slug: z.string().min(1), position: z.number().int().min(0).default(0) }))
    .max(60)
    .default([]),
  case_study: caseStudySchema.default({}),
});

export const workImportFileSchema = z.object({
  version: z.literal(1),
  categories: z.array(workImportCategorySchema).max(100).default([]),
  works: z.array(workImportWorkSchema).max(500).default([]),
});

export type WorkImportCategory = z.infer<typeof workImportCategorySchema>;
export type WorkImportWork = z.infer<typeof workImportWorkSchema>;
export type WorkImportFile = z.infer<typeof workImportFileSchema>;

/** First error message per field, for inline form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
