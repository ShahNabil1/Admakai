import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fallbackRates, type CurrencyCode } from '@/data/fallbackRates';
import { cachedRates, currencyRate, CURRENCY_KEY, formatCurrencyRange, isCurrency, RATE_CACHE_KEY, validRates, type Rates } from './currency-rules';

let rateRequest: Promise<Rates | null> | null = null;
function fetchRates() {
  if (rateRequest) return rateRequest;
  rateRequest = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD', { signal: controller.signal });
      if (!response.ok) return null;
      const data = await response.json() as { result?: string; rates?: unknown };
      const rates = validRates(data.rates);
      if (data.result !== 'success' || rates.USD !== 1 || Object.keys(rates).length < 2) return null;
      try { localStorage.setItem(RATE_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), rates })); } catch {}
      return rates;
    } catch { return null; } finally { clearTimeout(timeout); }
  })();
  return rateRequest;
}
type CurrencyContextValue = { currency: CurrencyCode; rate: number; setCurrency: (currency: CurrencyCode) => void; formatRange: (minUsd: number, maxUsd: number) => string };
const CurrencyContext = createContext<CurrencyContextValue>({ currency: 'USD', rate: 1, setCurrency: () => {}, formatRange: (min, max) => formatCurrencyRange(min, max) });
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setSelectedCurrency] = useState<CurrencyCode>('USD');
  const [rates, setRates] = useState<Rates>(fallbackRates);
  useEffect(() => {
    let disposed = false;
    let cached: Rates | null = null;
    try {
      const stored = localStorage.getItem(CURRENCY_KEY);
      if (isCurrency(stored)) setSelectedCurrency(stored);
      cached = cachedRates(localStorage.getItem(RATE_CACHE_KEY), Date.now());
    } catch {}
    if (cached) { setRates(cached); return; }
    void fetchRates().then(result => { if (!disposed && result) setRates(result); });
    return () => { disposed = true; };
  }, []);
  const value = useMemo<CurrencyContextValue>(() => {
    const rate = currencyRate(currency, rates);
    return { currency, rate, setCurrency: code => { if (!isCurrency(code)) return; setSelectedCurrency(code); try { localStorage.setItem(CURRENCY_KEY, code); } catch {} }, formatRange: (min, max) => formatCurrencyRange(min, max, currency, rate) };
  }, [currency, rates]);
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}
export function useCurrency() { return useContext(CurrencyContext); }