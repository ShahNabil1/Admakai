export const supportedCurrencies = ['USD', 'BDT', 'EUR', 'GBP', 'AED', 'SAR', 'INR', 'CAD', 'AUD', 'MYR', 'SGD'] as const;
export type CurrencyCode = typeof supportedCurrencies[number];
export const fallbackRates: Record<CurrencyCode, number> = { USD: 1, BDT: 123, EUR: .92, GBP: .78, AED: 3.67, SAR: 3.75, INR: 88, CAD: 1.38, AUD: 1.52, MYR: 4.2, SGD: 1.3 };