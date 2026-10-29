import { expect, it } from 'vitest';
import { enquiryPhone, internationalPhone, phoneCountries } from './international-phone';
it('accepts a US phone number without adding Bangladesh code', () => expect(enquiryPhone('+1 202-555-0123')).toBe('12025550123'));
it('accepts a UK phone number', () => expect(enquiryPhone('+44 7700 900123')).toBe('447700900123'));
it('uses the selected country for a national number', () => expect(internationalPhone('020 7946 0018', 'GB')?.number).toBe('+442079460018'));
it('converts Bangla numerals to English', () => expect(enquiryPhone('+৮৮০ ১৭১২৩৪৫৬৭৮')).toBe('8801712345678'));
it('keeps Bangladesh local numbers compatible', () => expect(enquiryPhone('01712345678')).toBe('8801712345678'));
it('rejects impossible international phone lengths', () => expect(internationalPhone('+1 123')).toBeNull());
it('includes accurate calling codes for multiple regions', () => { for (const [code, callingCode] of [['BD','880'],['US','1'],['GB','44'],['IN','91'],['AE','971'],['BR','55']]) expect(phoneCountries.find(item => item.code === code)?.callingCode).toBe(callingCode); });