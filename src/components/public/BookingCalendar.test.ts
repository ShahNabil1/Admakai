import { describe, expect, it } from 'vitest';
import { monthDays, moveMonth } from './BookingCalendar';

describe('Booking calendar navigation', () => {
  it('uses Monday-first columns for October 2026', () => {
    const days = monthDays('2026-10');
    expect(days.slice(0, 4)).toEqual(['', '', '', '2026-10-01']);
    expect(days.filter(Boolean)).toHaveLength(31);
  });
  it('moves a calendar month across the year boundary', () => {
    expect(moveMonth('2026-12', 1)).toBe('2027-01');
    expect(moveMonth('2027-01', -1)).toBe('2026-12');
  });
});