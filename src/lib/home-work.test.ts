import { describe, expect, it, vi } from 'vitest';
vi.mock('./supabase', () => ({ supabase: { from: vi.fn() } }));
import { recentFeaturedWorks, getPublishedWorkCount, type WorkWithLinks } from './works';
import { supabase } from './supabase';
describe('Home real work rules', () => {
  const work = (i: number, published = true, featured = true) => ({ id: String(i), published, featured, created_at: `2026-11-${String(i).padStart(2, '0')}` }) as WorkWithLinks;
  it('shows at most six featured published works, newest first', () => {
    expect(recentFeaturedWorks([work(1), work(2), work(3), work(4), work(5), work(6), work(7), work(8, false), work(9, true, false)]).map(row => row.id)).toEqual(['7', '6', '5', '4', '3', '2']);
  });
  it('reads the exact published count without copying portfolio rows', async () => {
    const eq = vi.fn().mockResolvedValue({count: 75, error: null});
    const select = vi.fn().mockReturnValue({eq});
    vi.mocked(supabase.from).mockReturnValue({select} as never);
    expect(await getPublishedWorkCount()).toBe(75);
    expect(select).toHaveBeenCalledWith('id', {count: 'exact', head: true});
    expect(eq).toHaveBeenCalledWith('published', true);
  });
  it('omits the number when the count cannot be read', async () => {
    vi.mocked(supabase.from).mockReturnValue({select: () => ({eq: async () => ({count: null, error: {message: 'unavailable'}})})} as never);
    expect(await getPublishedWorkCount()).toBeNull();
  });
});