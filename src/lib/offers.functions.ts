import { createServerFn } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { offerSaveSchema, type OfferValues } from './offer-schema';

/** Public: offers that are live right now (never cached, so switching one off shows normal prices on the next load). */
export const getLiveOffers = createServerFn({ method: 'GET' }).handler(async () => {
  setResponseHeader('Cache-Control', 'no-store');
  const { loadLiveOffers } = await import('./offers.server');
  return loadLiveOffers();
});

type DbError = { code?: string; message?: string } | null;
function ok<T>(result: { data: T | null; error: DbError }): T {
  if (result.error) {
    console.error('Offer change failed', { code: result.error.code ?? null, message: result.error.message });
    if (result.error.code === '23505') throw new Error('Another offer already uses this slug.');
    if (result.error.code === '42501') throw new Error('Only owners and hiring admins can change offers.');
    if (result.error.code === '23514') throw new Error('Some values are not allowed. Check the dates, discount and colours.');
    throw new Error('This change could not be saved. Please try again.');
  }
  if (result.data === null) throw new Error('This offer no longer exists. Please refresh.');
  return result.data;
}
async function requireEditor(context: { supabase: SupabaseClient<Database> }) {
  const allowed = ok(await context.supabase.rpc('can_edit_site_content'));
  if (allowed !== true) throw new Error('Only owners and hiring admins can change offers.');
}
type Insert = Database['public']['Tables']['offers']['Insert'];
function toRow(v: OfferValues): Insert {
  const selected = v.appliesTo === 'selected';
  return {
    name: v.name, slug: v.slug, preset: v.preset, headline: v.headline, short_badge: v.shortBadge, discount_percent: v.discountPercent,
    applies_to: v.appliesTo, selected_service_ids: selected ? v.selectedServiceIds : [], selected_plan_ids: selected ? v.selectedPlanIds : [],
    starts_at: v.startsAt, ends_at: v.endsAt, is_active: v.isActive, priority: v.priority, show_bar: v.showBar, show_countdown: v.showCountdown,
    cta_text: v.ctaText, cta_link: v.ctaLink, theme: v.theme,
  };
}

/** Editors: every offer, booking/enquiry counts, and the services and plans to pick from. */
export const readOffersAdmin = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    setResponseHeader('Cache-Control', 'no-store');
    await requireEditor(context);
    const db = context.supabase;
    const [offers, counts, services, plans] = await Promise.all([
      db.from('offers').select('*').order('created_at', { ascending: false }).limit(300),
      db.rpc('offer_lead_counts'),
      db.from('services').select('id, slug, name, category, price_min, price_max, price_unit, is_published').order('sort_order').limit(500),
      db.from('plans').select('id, slug, name, price_min, price_max, is_published').order('sort_order').limit(50),
    ]);
    return {
      offers: ok(offers), counts: ok(counts), serverNow: Date.now(),
      services: ok(services).map(s => ({ ...s, price_min: Number(s.price_min), price_max: Number(s.price_max) })),
      plans: ok(plans).map(p => ({ ...p, price_min: Number(p.price_min), price_max: Number(p.price_max) })),
    };
  });

export const saveOffer = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => offerSaveSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireEditor(context);
    const row = toRow(data.values);
    const result = data.id
      ? await context.supabase.from('offers').update(row).eq('id', data.id).select('id').maybeSingle()
      : await context.supabase.from('offers').insert(row).select('id').single();
    return { id: ok(result).id };
  });

const idInput = z.object({ id: z.string().uuid() });
export const setOfferActive = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.extend({ active: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireEditor(context);
    ok(await context.supabase.from('offers').update({ is_active: data.active }).eq('id', data.id).select('id').single());
    return { ok: true };
  });

/** Ends a running offer now; an offer that has not started yet is switched off instead. */
export const endOfferNow = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireEditor(context);
    const offer = ok(await context.supabase.from('offers').select('starts_at').eq('id', data.id).single());
    const now = new Date();
    const patch = new Date(offer.starts_at).getTime() < now.getTime() - 1000 ? { ends_at: now.toISOString() } : { is_active: false };
    ok(await context.supabase.from('offers').update(patch).eq('id', data.id).select('id').single());
    return { ok: true };
  });

/** Copies an offer switched off; an ended offer's dates move forward one year so it can be reused next season. */
export const duplicateOffer = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireEditor(context);
    const o = ok(await context.supabase.from('offers').select('*').eq('id', data.id).single());
    const ended = o.ends_at !== null && new Date(o.ends_at).getTime() <= Date.now();
    const shift = (iso: string) => { const d = new Date(iso); d.setUTCFullYear(d.getUTCFullYear() + 1); return d.toISOString(); };
    const suffix = Math.random().toString(36).slice(2, 7);
    const copy: Insert = {
      name: `${o.name} (copy)`.slice(0, 120), slug: `${o.slug.slice(0, 70)}-${suffix}`, preset: o.preset, headline: o.headline, short_badge: o.short_badge,
      discount_percent: o.discount_percent, applies_to: o.applies_to, selected_service_ids: o.selected_service_ids, selected_plan_ids: o.selected_plan_ids,
      starts_at: ended ? shift(o.starts_at) : o.starts_at, ends_at: o.ends_at ? (ended ? shift(o.ends_at) : o.ends_at) : null,
      is_active: false, priority: o.priority, show_bar: o.show_bar, show_countdown: o.show_countdown, cta_text: o.cta_text, cta_link: o.cta_link, theme: o.theme,
    };
    const saved = ok(await context.supabase.from('offers').insert(copy).select('id').single());
    return { id: saved.id };
  });
