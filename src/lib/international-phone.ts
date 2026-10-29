import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/max';
import { normalizePhoneInput } from './booking-form';

const names = new Intl.DisplayNames(['en'], { type: 'region' });
export const phoneCountries = getCountries().map(code => ({ code, name: names.of(code) ?? code, callingCode: getCountryCallingCode(code) })).sort((a, b) => a.name.localeCompare(b.name, 'en'));

export function internationalPhone(value: string, country: CountryCode = 'BD') {
  const clean = normalizePhoneInput(value);
  const phone = parsePhoneNumberFromString(clean, country);
  return phone?.isPossible() ? phone : null;
}
export function enquiryPhone(value: string) {
  const clean = normalizePhoneInput(value);
  // Keep existing Bangladesh local submissions compatible; explicit international
  // values are never prefixed with Bangladesh's code.
  const phone = internationalPhone(clean.startsWith('+') || /^0/.test(clean) ? clean : `+${clean}`);
  return phone ? phone.number.slice(1) : clean.replace(/[^\d]/g, '');
}