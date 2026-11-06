import { fallbackRates, supportedCurrencies, type CurrencyCode } from '@/data/fallbackRates';

export const RATE_CACHE_KEY = 'admakai-currency-rates';
export const CURRENCY_KEY = 'admakai-currency';
export const RATE_CACHE_DURATION = 24 * 60 * 60 * 1000;
export type Rates = Partial<Record<CurrencyCode, number>>;
export function isCurrency(value: unknown): value is CurrencyCode { return supportedCurrencies.some(code => code === value); }
export function validRates(value: unknown): Rates {
  if (!value || typeof value !== 'object') return {};
  const source = value as Record<string, unknown>;
  return Object.fromEntries(supportedCurrencies.flatMap(code => typeof source[code] === 'number' && Number.isFinite(source[code]) && source[code] > 0 ? [[code, source[code]]] : []));
}
export function cachedRates(raw: string | null, now: number): Rates | null {
  try {
    if (!raw) return null;
    const cache = JSON.parse(raw) as { timestamp?: unknown; rates?: unknown };
    if (typeof cache.timestamp !== 'number' || cache.timestamp > now || now - cache.timestamp >= RATE_CACHE_DURATION) return null;
    const rates = validRates(cache.rates);
    return rates.USD === 1 && Object.keys(rates).length > 1 ? rates : null;
  } catch { return null; }
}
export function currencyRate(currency: CurrencyCode, rates: Rates) { return rates[currency] ?? fallbackRates[currency]; }
export function roundingStep(currency: CurrencyCode) { return currency === 'BDT' || currency === 'INR' ? 500 : currency === 'AED' || currency === 'SAR' || currency === 'MYR' ? 10 : 5; }
export function convertRange(minUsd: number, maxUsd: number, currency: CurrencyCode, rate: number) {
  const step = roundingStep(currency);
  return { min: Math.floor((minUsd * rate + 1e-9) / step) * step, max: Math.ceil((maxUsd * rate - 1e-9) / step) * step };
}
export function formatCurrencyRange(minUsd: number, maxUsd: number, currency: CurrencyCode = 'USD', rate = fallbackRates[currency]) {
  const { min, max } = convertRange(minUsd, maxUsd, currency, rate);
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: 'narrowSymbol', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const format = (amount: number) => currency === 'BDT' ? `৳${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)}` : formatter.format(amount);
  return `${format(min)} to ${format(max)}`;
}