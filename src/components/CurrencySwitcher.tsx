import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supportedCurrencies, type CurrencyCode } from '@/data/fallbackRates';
import { useCurrency } from '@/lib/currency';
import './currency-switcher.css';

export function CurrencySwitcher({ location }: { location: 'header' | 'services' }) {
  const { currency, setCurrency } = useCurrency();
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className={`currency-switcher currency-switcher-${location}`} aria-label={`Currency (${location}): ${currency}`}>{currency}<ChevronDown size={12} aria-hidden="true"/></Button></DropdownMenuTrigger><DropdownMenuContent className="currency-switcher-menu" align="end"><DropdownMenuRadioGroup value={currency} onValueChange={value => { if (supportedCurrencies.includes(value as CurrencyCode)) setCurrency(value as CurrencyCode); }}>{supportedCurrencies.map(code => <DropdownMenuRadioItem key={code} value={code}>{code}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu>;
}