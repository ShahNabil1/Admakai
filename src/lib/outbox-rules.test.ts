import { describe, expect, it } from 'vitest';
import { canAutoRetry, deliveryLabel, pageCount, pageRange, retryDelayMinutes, summariseDeliveries } from './outbox-rules';

describe('delivery outbox rules', () => {
  it('stops automatic retries after 5 attempts', () => {
    expect(canAutoRetry(4)).toBe(true);
    expect(canAutoRetry(5)).toBe(false);
  });
  it('waits longer after each failure, capped at an hour', () => {
    expect(retryDelayMinutes(1)).toBe(2);
    expect(retryDelayMinutes(3)).toBe(8);
    expect(retryDelayMinutes(10)).toBe(60);
  });
  it('labels deliveries Sent, Pending or Failed', () => {
    expect(deliveryLabel('sent')).toBe('Sent');
    expect(deliveryLabel('sending')).toBe('Pending');
    expect(deliveryLabel('failed')).toBe('Failed');
  });
  it('never reports success when any delivery failed', () => {
    expect(summariseDeliveries(['sent', 'failed'])).toBe('failed');
    expect(summariseDeliveries(['sent', 'pending'])).toBe('queued');
    expect(summariseDeliveries(['sent'])).toBe('sent');
  });
  it('pages 50 rows at a time', () => {
    expect(pageRange(0)).toEqual({ from: 0, to: 49 });
    expect(pageRange(2)).toEqual({ from: 100, to: 149 });
    expect(pageCount(101)).toBe(3);
    expect(pageCount(0)).toBe(1);
  });
});
