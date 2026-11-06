import { describe, expect, it } from 'vitest';
import { isoDuration, rankUpNext, splitByOrientation, workMatchesQuery } from './work-search';
import type { WorkWithLinks } from './works';

function work(partial: Partial<WorkWithLinks>): WorkWithLinks {
  return {
    id: '1', slug: 'a', title: 'A', vimeo_id: '1', aspect: '16:9', duration_sec: 30,
    thumbnail_url: null, category_id: null, client_name: null, industry: null, year: 2026,
    short_description: null, tags: [], featured: false, published: true, sort_order: 0,
    case_study: {}, seo_title: null, seo_description: null, created_at: '', updated_at: '',
    work_categories: null, work_services: [], ...partial,
  };
}

const serviceName = (slug: string) => ({ 'ai-ugc-ads': 'AI UGC Ads', 'fashion-film': 'Fashion Film' })[slug] ?? slug;

describe('workMatchesQuery', () => {
  it('matches partial words case insensitively', () => {
    const w = work({ title: 'Summer Serum Launch', client_name: 'Gentle Park' });
    expect(workMatchesQuery(w, 'serum', serviceName)).toBe(true);
    expect(workMatchesQuery(w, 'SERUM', serviceName)).toBe(true);
    expect(workMatchesQuery(w, 'ser', serviceName)).toBe(true);
    expect(workMatchesQuery(w, 'gentle serum', serviceName)).toBe(true);
  });
  it('requires every typed word to match', () => {
    const w = work({ title: 'Summer Serum Launch' });
    expect(workMatchesQuery(w, 'serum winter', serviceName)).toBe(false);
  });
  it('searches tags, industry, category and linked service names', () => {
    const w = work({
      title: 'Glow', tags: ['skincare'], industry: 'Beauty',
      work_categories: { id: 'c', slug: 'fashion', name: 'Fashion', sort_order: 1, created_at: '' },
      work_services: [{ service_slug: 'ai-ugc-ads', position: 0 }],
    });
    expect(workMatchesQuery(w, 'skincare', serviceName)).toBe(true);
    expect(workMatchesQuery(w, 'beauty', serviceName)).toBe(true);
    expect(workMatchesQuery(w, 'fashion', serviceName)).toBe(true);
    expect(workMatchesQuery(w, 'ugc', serviceName)).toBe(true);
    expect(workMatchesQuery(w, 'missing', serviceName)).toBe(false);
  });
  it('matches everything when the query is empty', () => {
    expect(workMatchesQuery(work({}), '  ', serviceName)).toBe(true);
  });
});

describe('splitByOrientation', () => {
  it('sends 9:16 works to reels and keeps the rest in the grid', () => {
    const a = work({ id: 'a', aspect: '16:9' });
    const b = work({ id: 'b', aspect: '9:16' });
    const c = work({ id: 'c', aspect: '4:5' });
    const d = work({ id: 'd', aspect: '1:1' });
    const { grid, reels } = splitByOrientation([a, b, c, d]);
    expect(grid.map((w) => w.id)).toEqual(['a', 'c', 'd']);
    expect(reels.map((w) => w.id)).toEqual(['b']);
  });
});

describe('rankUpNext', () => {
  const base = work({ id: 'current', category_id: 'cat-a', work_services: [{ service_slug: 'ai-video-ads', position: 1 }] });
  const sameCategory = work({ id: 'same-cat', category_id: 'cat-a', sort_order: 2 });
  const sameService = work({ id: 'same-service', category_id: 'cat-b', sort_order: 3, work_services: [{ service_slug: 'ai-video-ads', position: 1 }] });
  const featured = work({ id: 'featured', category_id: 'cat-b', sort_order: 4, featured: true });
  const plain = work({ id: 'plain', category_id: 'cat-b', sort_order: 5 });

  it('orders same category, then shared service, then featured, then the rest', () => {
    const ranked = rankUpNext(base, [plain, featured, sameService, sameCategory, base]);
    expect(ranked.map((w) => w.id)).toEqual(['same-cat', 'same-service', 'featured', 'plain']);
  });

  it('never includes the current work', () => {
    expect(rankUpNext(base, [base, sameCategory]).some((w) => w.id === 'current')).toBe(false);
  });

  it('respects the limit', () => {
    const many = Array.from({ length: 15 }, (_, i) => work({ id: `w${i}`, sort_order: i }));
    expect(rankUpNext(base, many)).toHaveLength(10);
  });
});

describe('isoDuration', () => {
  it('formats seconds as ISO 8601', () => {
    expect(isoDuration(81)).toBe('PT1M21S');
    expect(isoDuration(21)).toBe('PT0M21S');
  });
  it('returns undefined for missing or zero durations', () => {
    expect(isoDuration(null)).toBeUndefined();
    expect(isoDuration(0)).toBeUndefined();
  });
});
