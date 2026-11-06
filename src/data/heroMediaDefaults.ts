import type { HeroMedia, Service } from './services';

export type HeroMediaSet = { reels: HeroMedia[]; sides: HeroMedia[] };

export const heroMediaDefaults: Record<string, HeroMediaSet> = {
  'video-ads': { reels: [], sides: [] },
  imagery: { reels: [], sides: [] },
  people: { reels: [], sides: [] },
  social: { reels: [], sides: [] },
  voice: { reels: [], sides: [] },
  strategy: { reels: [], sides: [] },
};

/** Service media first, then its category default; empty slots render placeholders. */
export function resolveHeroMedia(service: Pick<Service, 'category' | 'heroMedia'>): HeroMediaSet {
  const own = service.heroMedia;
  const fallback = heroMediaDefaults[service.category] ?? { reels: [], sides: [] };
  return {
    reels: own?.reels.length ? own.reels : fallback.reels,
    sides: own?.sides.length ? own.sides : fallback.sides,
  };
}

/** Joins the headline parts, keeping punctuation tight after the accent. */
export function heroTitleText(t: { lead: string; accent: string; rest: string }) {
  const rest = t.rest ? (/^[.,!?]/.test(t.rest) ? t.rest : ` ${t.rest}`) : '';
  return `${t.lead} ${t.accent}${rest}`;
}
