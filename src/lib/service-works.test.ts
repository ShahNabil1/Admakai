import { describe, expect, it } from 'vitest';
import { pickServiceWorks, siblingServiceSlugs } from './service-works';
import type { WorkWithLinks } from './works';

const work = (id: string, links: string[], extra: Partial<WorkWithLinks> = {}) => ({
  id, slug: id, published: true, featured: false, sort_order: 0,
  work_services: links.map((service_slug, position) => ({ service_slug, position })), ...extra,
}) as unknown as WorkWithLinks;

describe('service portfolio works', () => {
  it('uses directly linked published works in their given order', () => {
    const direct = [work('b', ['ai-ugc-ads']), work('a', ['ai-ugc-ads']), work('hidden', ['ai-ugc-ads'], { published: false })];
    expect(pickServiceWorks('ai-ugc-ads', direct, []).map(w => w.id)).toEqual(['b', 'a']);
  });
  it('falls back to same-category works, featured first, max six', () => {
    const sibling = siblingServiceSlugs('ai-ugc-ads')[0]!;
    const pool = [...Array.from({ length: 7 }, (_, i) => work(`s${i}`, [sibling], { sort_order: i })), work('f', [sibling], { featured: true, sort_order: 9 }), work('other', ['ai-voiceover'])];
    const picked = pickServiceWorks('ai-ugc-ads', [], pool).map(w => w.id);
    expect(picked).toHaveLength(6);
    expect(picked[0]).toBe('f');
    expect(picked).not.toContain('other');
  });
  it('returns nothing when no category works exist', () => expect(pickServiceWorks('ai-voiceover', [], [work('x', ['ai-ugc-ads'])])).toEqual([]));
});
