import { fallbackRates } from '@/data/fallbackRates';
import { cachedRates, currencyRate, RATE_CACHE_KEY } from '@/lib/currency-rules';

/** BDT rate for admin previews: the visitor-side 24-hour cached rate when present, otherwise the approved fallback. */
export function previewRate() {
  try {
    const cached = cachedRates(localStorage.getItem(RATE_CACHE_KEY), Date.now());
    if (cached) return currencyRate('BDT', cached);
  } catch { /* storage unavailable */ }
  return fallbackRates.BDT;
}
