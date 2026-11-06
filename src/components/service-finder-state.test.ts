import { describe, expect, it } from 'vitest';
import { appendFinderExchange, createFinderExchange, finderGreeting, FINDER_HISTORY_LIMIT, FINDER_REDIRECT_DELAY, FINDER_REPLY_DELAY } from './service-finder-state';
import { matchService } from '@/lib/serviceMatcher';
import { services } from '@/data/services';
import { SERVICE_KEYWORDS } from '@/data/serviceKeywords';

describe('Service finder rules', () => {
  it.each([[5, 'Good morning,'], [11, 'Good morning,'], [12, 'Good afternoon,'], [16, 'Good afternoon,'], [17, 'Good evening,'], [4, 'Good evening,'], [23, 'Good evening,']])('greets at device hour %s', (hour, greeting) => expect(finderGreeting(Number(hour))).toBe(greeting));
  it.each([
    ['amar kapor er online business, model chara chobi lagbe', 'virtual-try-on'],
    ['ঈদের অফারের জন্য অ্যাড বানাতে চাই', 'festival-campaign-pack'],
    ['We have a SaaS product, need a demo video', 'saas-explainer'],
    ['TV commercial for my juice brand', 'ai-commercial-30s'],
    ['white background photos of 200 products for daraz', 'ecommerce-catalogue-pack'],
    ['cut my podcast into shorts', 'long-to-short-repurposing'],
    ['আমাদের AGM এর জন্য AVC লাগবে', 'corporate-avc-event-video'],
    ['my ads are not working, roas is bad', 'ad-performance-review'],
    ['jingle for my restaurant', 'jingle-sonic-logo'],
    ['amar nijer voice clone kore video', 'digital-clone'],
    ['প্রতি মাসে রিল আর পোস্ট লাগবে', 'monthly-content-subscription'],
  ])('matches %s', (text, slug) => expect(createFinderExchange(1, text).result).toMatchObject({ confidence: 'strong', best: slug }));
  it('returns no match for hello', () => expect(createFinderExchange(1, 'hello').result).toMatchObject({ confidence: 'none', best: null }));
  it('computes immediately but initially leaves the reply pending', () => expect(createFinderExchange(1, 'saas')).toMatchObject({ ready: false, result: { best: 'saas-explainer' } }));
  it('waits 600ms before displaying the reply', () => expect(FINDER_REPLY_DELAY).toBe(600));
  it('uses a three-second optional redirect delay', () => expect(FINDER_REDIRECT_DELAY).toBe(3000));
  it('keeps only the last four exchanges', () => {
    let history: ReturnType<typeof createFinderExchange>[] = [];
    for (let id = 1; id <= 6; id++) history = appendFinderExchange(history, createFinderExchange(id, 'saas'));
    expect(FINDER_HISTORY_LIMIT).toBe(4);
    expect(history.map(exchange => exchange.id)).toEqual([3, 4, 5, 6]);
  });
  it('respects the enabled published slug allowlist', () => expect(matchService('saas demo video', ['ai-voiceover']).best).toBeNull());
  it('has an existing catalogue service for every keyword slug', () => {
    const missing = Object.keys(SERVICE_KEYWORDS).filter(slug => !services.some(service => service.slug === slug));
    expect(Object.keys(SERVICE_KEYWORDS).length).toBe(37);
    expect(missing).toEqual([]);
  });
  it('excludes unpublished services from best, alternatives and scores', () => {
    const service = services.find(item => item.slug === 'monthly-content-subscription');
    if (!service) throw new Error('Required monthly service is missing');
    const prompt = 'প্রতি মাসে রিল আর পোস্ট লাগবে';
    expect(createFinderExchange(1, prompt).result.best).toBe(service.slug);
    const published = service.published;
    try {
      service.published = false;
      const result = createFinderExchange(2, prompt).result;
      expect(result.best).not.toBe(service.slug);
      expect(result.alternatives).not.toContain(service.slug);
      expect(result.scores).not.toHaveProperty(service.slug);
    } finally {
      service.published = published;
    }
  });
  it('preserves weak confidence for generic input', () => expect(createFinderExchange(1, 'premium').result.confidence).toBe('weak'));
});