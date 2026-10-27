import { describe, expect, it } from 'vitest';
import { AD_COUNT, BRAND_COUNT, clients, marqueeClients, repeatClients } from './clients';

describe('Client section values', () => {
  it('defaults to 40 brands', () => { expect(BRAND_COUNT).toBe(40); });
  it('defaults to 300 ads', () => { expect(AD_COUNT).toBe(300); });
  it('includes all ten supplied client logos', () => { expect(clients).toHaveLength(10); expect(new Set(clients.map((client) => client.src)).size).toBe(10); });
  it('repeats the complete list until each marquee has at least 12 items', () => {
    expect(marqueeClients.length).toBeGreaterThanOrEqual(12);
    expect(marqueeClients).toEqual([...clients, ...clients]);
    expect(repeatClients(['a', 'b', 'c'])).toHaveLength(12);
  });
});