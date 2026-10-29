import { expect, it } from 'vitest';
import { legalContactEmail } from './legal';

it('uses the privacy-request email approved by Admakai', () => {
  expect(legalContactEmail).toBe('hello@admakai.com');
});