import { useRef, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/max';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { normalizePhoneInput } from '@/lib/booking-form';
import { phoneCountries } from '@/lib/international-phone';
import './international-phone.css';

const flagFiles = import.meta.glob('../../../node_modules/country-flag-icons/3x2/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
function Flag({ country }: { country: CountryCode }) {
  return <img className="phone-flag" alt="" aria-hidden="true" src={flagFiles[`../../../node_modules/country-flag-icons/3x2/${country}.svg`]}/>;
}

export function InternationalPhoneField({ error, onChange }: { error?: string | undefined; onChange: () => void }) {
  const [country, setCountry] = useState<CountryCode>('BD');
  const [number, setNumber] = useState('');
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const code = getCountryCallingCode(country);
  const name = phoneCountries.find(item => item.code === country)?.name ?? country;
  const parsed = parsePhoneNumberFromString(number, country);
  const value = number ? parsed?.number ?? `+${code}${number.replace(/[^\d]/g, '')}` : '';

  const changeNumber = (raw: string) => {
    const clean = normalizePhoneInput(raw);
    if (clean.startsWith('+')) {
      const pasted = parsePhoneNumberFromString(clean);
      const pastedCountry = pasted?.country ?? pasted?.getPossibleCountries()[0];
      if (pasted && pastedCountry) { setCountry(pastedCountry); setNumber(pasted.nationalNumber); onChange(); return; }
    }
    setNumber(clean);
    onChange();
  };

  return <div className="booking-field international-phone">
    <label htmlFor="whatsapp">WhatsApp number</label>
    <div className="phone-control" data-invalid={!!error}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild><Button type="button" variant="ghost" className="phone-country-trigger" role="combobox" aria-expanded={open} aria-label={`Country: ${name}, +${code}`}><Flag country={country}/><span>+{code}</span><ChevronsUpDown size={13}/></Button></PopoverTrigger>
        <PopoverContent className="phone-country-menu" align="start" sideOffset={8} collisionPadding={16}>
          <Command><CommandInput placeholder="Search country or code…" aria-label="Search country or code"/><CommandList data-lenis-prevent><CommandEmpty>No country found.</CommandEmpty>{phoneCountries.map(item => <CommandItem key={item.code} value={`${item.name} ${item.code} +${item.callingCode}`} onSelect={() => { setCountry(item.code); setOpen(false); onChange(); requestAnimationFrame(() => input.current?.focus()); }} className="phone-country-option"><Flag country={item.code}/><span className="phone-country-name">{item.name}</span><span className="phone-country-code">+{item.callingCode}</span>{country === item.code && <Check size={14}/>}</CommandItem>)}</CommandList></Command>
        </PopoverContent>
      </Popover>
      <input ref={input} id="whatsapp" type="tel" autoComplete="tel-national" inputMode="tel" required maxLength={30} placeholder="Phone number" value={number} onChange={event => changeNumber(event.target.value)} aria-invalid={!!error} aria-describedby={error ? 'whatsapp-error' : undefined}/>
      <input type="hidden" name="whatsapp" value={value}/>
    </div>
    {error && <p className="field-error" id="whatsapp-error" role="alert">{error}</p>}
  </div>;
}