import { describe, expect, it } from 'vitest';
import { clients, marqueeClients, repeatClients } from './clients';

describe('Client section values', () => {
  it('includes all ten supplied client logos', () => { expect(clients).toHaveLength(10); expect(new Set(clients.map((client) => client.src)).size).toBe(10); });
  it('repeats the complete list until each marquee has at least 12 items', () => {
    expect(marqueeClients.length).toBeGreaterThanOrEqual(12);
    expect(marqueeClients).toEqual([...clients, ...clients]);
    expect(repeatClients(['a', 'b', 'c'])).toHaveLength(12);
  });
});