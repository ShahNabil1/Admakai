import { describe, expect, it } from 'vitest';
import { collectPublishedProjects, sitemapXml } from '../../scripts/sitemap';
describe('Sitemap rules', () => {
  it('reads every published project batch', async () => {
    const offsets: number[] = [];
    const rows = await collectPublishedProjects(async offset => { offsets.push(offset); return offset < 2 ? [{ slug: `project-${offset}` }] : []; });
    expect(offsets).toEqual([0, 1, 2]); expect(rows.map(row => row.path)).toEqual(['/work/project-0', '/work/project-1']);
  });
  it('does not return a partial project list when a later batch fails', async () => {
    await expect(collectPublishedProjects(async offset => { if (offset) throw new Error('Unavailable'); return [{ slug: 'first' }]; })).rejects.toThrow('Unavailable');
  });
  it('uses content updated_at and omits invented dates', () => {
    const xml = sitemapXml([{ path: '/' }, { path: '/work/test', lastmod: '2026-10-20T12:00:00Z' }]);
    expect(xml.match(/<lastmod>/g)).toHaveLength(1); expect(xml).toContain('<lastmod>2026-10-20T12:00:00.000Z</lastmod>');
  });
});