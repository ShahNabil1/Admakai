import { describe, expect, it } from 'vitest';
import { fallbackRates, supportedCurrencies } from '@/data/fallbackRates';
import { cachedRates, convertRange, currencyRate, formatCurrencyRange, RATE_CACHE_DURATION, roundingStep, validRates } from './currency-rules';

describe('currency rules', () => {
  it('supports the eleven specified currencies in order', () => expect(supportedCurrencies).toEqual(['USD','BDT','EUR','GBP','AED','SAR','INR','CAD','AUD','MYR','SGD']));
  it.each([['USD',1],['BDT',123],['EUR',.92],['GBP',.78],['AED',3.67],['SAR',3.75],['INR',88],['CAD',1.38],['AUD',1.52],['MYR',4.2],['SGD',1.3]] as const)('uses the exact %s fallback', (code, rate) => expect(currencyRate(code, {})).toBe(rate));
  it.each([['USD',5],['EUR',5],['GBP',5],['CAD',5],['AUD',5],['SGD',5],['BDT',500],['INR',500],['AED',10],['SAR',10],['MYR',10]] as const)('rounds %s with the supplied increment', (currency, step) => expect(roundingStep(currency)).toBe(step));
  it('rounds the converted minimum down and maximum up', () => expect(convertRange(290, 440, 'BDT', 123)).toEqual({ min: 35500, max: 54500 }));
  it('formats BDT with its symbol and thousands separators', () => expect(formatCurrencyRange(290, 440, 'BDT', 123)).toBe('৳35,500 to ৳54,500'));
  it('keeps default USD amounts exact when already on five-dollar boundaries', () => expect(formatCurrencyRange(290,440)).toBe('$290 to $440'));
  it('uses the selected valid rate over its fallback', () => expect(currencyRate('BDT', { BDT: 125 })).toBe(125));
  it('falls back for a missing currency from the live table', () => expect(currencyRate('BDT', { USD: 1, EUR: .95 })).toBe(fallbackRates.BDT));
  it('only reuses a cache younger than 24 hours', () => {
    const cache = JSON.stringify({ timestamp: 1000, rates: { USD: 1, BDT: 125 } });
    expect(cachedRates(cache, 1000 + RATE_CACHE_DURATION - 1)).toEqual({ USD: 1, BDT: 125 });
    expect(cachedRates(cache, 1000 + RATE_CACHE_DURATION)).toBeNull();
  });
  it('rejects corrupted, invalid and future cache data', () => {
    expect(cachedRates('{bad', 1000)).toBeNull();
    expect(cachedRates(JSON.stringify({timestamp: 1001, rates:{USD:1,BDT:123}}), 1000)).toBeNull();
    expect(validRates({ USD: 1, BDT: -1, EUR: 'bad', GBP: Infinity })).toEqual({ USD: 1 });
  });
});