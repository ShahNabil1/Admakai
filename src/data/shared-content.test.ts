import { describe, expect, it } from 'vitest';
import { plans } from './plans';
import { capabilities, homeServiceSlugs } from './capabilities';
import { findPublishedService } from './services';
import { faqCostAnswer } from './faq';
import { formatCurrencyRange } from '@/lib/currency-rules';
describe('Shared approved public content', () => {
  for (const [id, min, max, calls] of [
    ['starter', 320, 540, 'Monthly strategy call'],
    ['growth', 550, 950, 'Two calls a month'],
    ['scale', 1010, 1760, 'Weekly call'],
  ] as const) {
    it(`${id} minimum`, () => expect(plans.find(plan => plan.id === id)?.priceMinUsd).toBe(min));
    it(`${id} maximum`, () => expect(plans.find(plan => plan.id === id)?.priceMaxUsd).toBe(max));
    it(`${id} call allowance`, () => expect(plans.find(plan => plan.id === id)?.calls).toBe(calls));
  }
  it('uses the eight approved home services in order', () => expect(homeServiceSlugs).toEqual([
    'ai-commercial-30s', 'ai-ugc-ads', 'ai-product-photoshoot', 'ai-brand-model',
    'ai-voiceover', 'motion-ad-logo-animation', 'fashion-film-lookbook', 'ad-variant-pack',
  ]));
  it('derives home services from published catalogue records', () => {
    for (const card of capabilities) {
      expect(card.name).toBe(findPublishedService(card.slug)?.name);
      expect(card.shortDescription).toBe(findPublishedService(card.slug)?.shortDescription);
      expect(card.priceMinUsd).toBe(findPublishedService(card.slug)?.priceMinUsd);
      expect(card.priceMaxUsd).toBe(findPublishedService(card.slug)?.priceMaxUsd);
    }
  });
  it('converts all four FAQ amounts with the selected formatter', () => {
    const calls: number[][] = [];
    faqCostAnswer((min, max) => { calls.push([min, max]); return formatCurrencyRange(min, max, 'BDT', 123); });
    expect(calls).toEqual([[320, 320], [290, 440], [70, 250], [50, 85]]);
  });
});