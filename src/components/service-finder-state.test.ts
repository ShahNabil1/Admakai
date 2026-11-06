import { describe, expect, it } from 'vitest';
import { appendFinderExchange, createFinderExchange, FINDER_HISTORY_LIMIT, FINDER_REDIRECT_DELAY, FINDER_REPLY_DELAY } from './service-finder-state';
import { matchService } from '@/lib/serviceMatcher';

describe('Service finder rules', () => {
  it.each([
    ['amar kapor er online business, model chara chobi lagbe', 'virtual-try-on'],
    ['ঈদের অফারের জন্য অ্যাড বানাতে চাই', 'festival-campaign-pack'],
    ['We have a SaaS product, need a demo video', 'saas-explainer'],
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
  it('preserves weak confidence for generic input', () => expect(createFinderExchange(1, 'premium').result.confidence).toBe('weak'));
});