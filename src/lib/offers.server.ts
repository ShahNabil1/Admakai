import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { isPreset, isScope, safeCtaLink, safeTheme, type PublicOffer } from './offer-rules';

export const PUBLIC_OFFER_COLUMNS = 'id, slug, preset, headline, short_badge, discount_percent, applies_to, selected_service_ids, selected_plan_ids, starts_at, ends_at, is_active, priority, show_bar, show_countdown, cta_text, cta_link, theme';
type OfferRow = Pick<Database['public']['Tables']['offers']['Row'], 'id' | 'slug' | 'preset' | 'headline' | 'short_badge' | 'discount_percent' | 'applies_to' | 'selected_service_ids' | 'selected_plan_ids' | 'starts_at' | 'ends_at' | 'is_active' | 'priority' | 'show_bar' | 'show_countdown' | 'cta_text' | 'cta_link' | 'theme'>;

export function rowToPublicOffer(row: OfferRow, serviceSlugs: Map<string, string>, planSlugs: Map<string, string>): PublicOffer {
  const preset = isPreset(row.preset) ? row.preset : 'custom';
  return {
    id: row.id, slug: row.slug, preset, headline: row.headline, shortBadge: row.short_badge, discountPercent: row.discount_percent,
    appliesTo: isScope(row.applies_to) ? row.applies_to : 'everything',
    serviceSlugs: (row.selected_service_ids ?? []).flatMap(id => serviceSlugs.get(id) ?? []),
    planSlugs: (row.selected_plan_ids ?? []).flatMap(id => planSlugs.get(id) ?? []),
    startsAt: row.starts_at, endsAt: row.ends_at, isActive: row.is_active, priority: row.priority,
    showBar: row.show_bar, showCountdown: row.show_countdown, ctaText: row.cta_text, ctaLink: safeCtaLink(row.cta_link),
    theme: safeTheme(row.theme, preset),
  };
}

/** Live offers read with the publishable key; RLS only returns switched-on offers inside their dates. Empty on any failure (normal prices). */
export async function loadLiveOffers(): Promise<{ offers: PublicOffer[]; serverNow: number }> {
  const serverNow = Date.now();
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) return { offers: [], serverNow };
  try {
    const client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
        headers.set('apikey', key);
        return fetch(input, { ...init, headers, signal: AbortSignal.timeout(3000) });
      } },
    });
    const offers = await client.from('offers').select(PUBLIC_OFFER_COLUMNS).order('priority', { ascending: false }).limit(20);
    if (offers.error) { console.error('Offer read failed; showing normal prices', offers.error.code); return { offers: [], serverNow }; }
    if (!offers.data.length) return { offers: [], serverNow };
    const needsItems = offers.data.some(o => o.applies_to === 'selected');
    const [services, plans] = needsItems
      ? await Promise.all([client.from('services').select('id, slug').eq('is_published', true).limit(500), client.from('plans').select('id, slug').eq('is_published', true).limit(50)])
      : [{ data: [] as { id: string; slug: string }[] }, { data: [] as { id: string; slug: string }[] }];
    const serviceSlugs = new Map((services.data ?? []).map(s => [s.id, s.slug]));
    const planSlugs = new Map((plans.data ?? []).map(p => [p.id, p.slug]));
    return { offers: offers.data.map(row => rowToPublicOffer(row, serviceSlugs, planSlugs)), serverNow };
  } catch (error) {
    console.error('Offers unreachable; showing normal prices', error instanceof Error ? error.name : 'unknown');
    return { offers: [], serverNow };
  }
}
