import { z } from 'zod';
import { OFFER_PRESETS, OFFER_SCOPES } from './offer-rules';

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Use a colour like #FFD43B');
const text = (max: number, label: string) => z.string().trim().min(1, `${label} is required`).max(max, `${label} must be ${max} characters or fewer`);

export const offerValuesSchema = z.object({
  name: text(120, 'Name'),
  slug: z.string().trim().min(1, 'Slug is required').max(80).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens'),
  preset: z.enum(OFFER_PRESETS),
  headline: text(160, 'Headline'),
  shortBadge: text(40, 'Short badge'),
  discountPercent: z.number().int().min(1, 'Discount must be 1 to 90 percent').max(90, 'Discount must be 1 to 90 percent'),
  appliesTo: z.enum(OFFER_SCOPES),
  selectedServiceIds: z.array(z.string().uuid()).max(200),
  selectedPlanIds: z.array(z.string().uuid()).max(50),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }).nullable(),
  isActive: z.boolean(),
  priority: z.number().int().min(-1000).max(1000),
  showBar: z.boolean(),
  showCountdown: z.boolean(),
  ctaText: text(40, 'Button text'),
  ctaLink: z.string().trim().max(200).regex(/^\/(?!\/)[A-Za-z0-9/_?=&.#%+-]*$/, 'Use a page on this site, like /pricing'),
  theme: z.object({ background: hex, text: hex, accent: hex, badge: hex }),
}).superRefine((v, ctx) => {
  if (v.endsAt && new Date(v.endsAt).getTime() <= new Date(v.startsAt).getTime()) ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'The end must be after the start' });
  if (v.appliesTo === 'selected' && v.selectedServiceIds.length + v.selectedPlanIds.length === 0) ctx.addIssue({ code: 'custom', path: ['appliesTo'], message: 'Pick at least one service or plan' });
});
export type OfferValues = z.infer<typeof offerValuesSchema>;
export const offerSaveSchema = z.object({ id: z.string().uuid().nullable(), values: offerValuesSchema });
