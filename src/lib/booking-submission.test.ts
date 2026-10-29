import { describe, expect, it } from 'vitest';
import { additionalBookingFields, bookingBudgetLabel, bookingServiceLabels, submissionText } from './booking-submission';

describe('complete booking submission data', () => {
  it('retains the full submitted message including lines and Bangla text', () => {
    const message = 'আমার পণ্যের বিজ্ঞাপন চাই\nSecond line\n' + 'x'.repeat(1950);
    expect(submissionText(message)).toBe(message);
  });
  it('retains extra submitted fields rather than discarding unknown data', () => {
    expect(additionalBookingFields({ need: 'tvc', message: 'Brief', product_url: 'https://example.com/item', formats: ['portrait', 'landscape'] })).toEqual([
      { key: 'product_url', value: 'https://example.com/item' }, { key: 'formats', value: '[\n  "portrait",\n  "landscape"\n]' },
    ]);
  });
  it('covers every available service and budget value without losing legacy values', () => {
    expect(Object.keys(bookingServiceLabels)).toEqual(['tvc', 'product_photos', 'ugc', 'brand_face', 'unsure']);
    expect(bookingBudgetLabel('30k_80k')).toBe('30k to 80k');
    expect(bookingBudgetLabel('80k_plus')).toBe('80k and above');
    expect(bookingBudgetLabel('not_decided')).toBe('Not decided');
    expect(bookingBudgetLabel('legacy budget')).toBe('legacy budget');
  });
});