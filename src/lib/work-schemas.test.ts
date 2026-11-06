import { describe, expect, it } from 'vitest';
import { fieldErrors, slugify, workFormSchema, workImportFileSchema, workImportWorkSchema } from './work-schemas';

describe('slugify', () => {
  it('makes lowercase hyphenated slugs', () => {
    expect(slugify('Gentle Park: Summer Drop!')).toBe('gentle-park-summer-drop');
    expect(slugify('  AI  UGC   Ads ')).toBe('ai-ugc-ads');
    expect(slugify('---')).toBe('');
  });
});

describe('workFormSchema', () => {
  const base = {
    slug: 'test-work', title: 'Test work', vimeo_id: '123456789', aspect: '16:9' as const,
    duration_sec: 30, thumbnail_url: null, category_id: null, client_name: null,
    industry: null, year: 2026, short_description: null, tags: [], featured: false,
    published: true, sort_order: 0, seo_title: null, seo_description: null, case_study: {},
  };
  it('accepts a minimal valid work', () => {
    expect(workFormSchema.safeParse(base).success).toBe(true);
  });
  it('rejects bad slugs and Vimeo IDs', () => {
    expect(workFormSchema.safeParse({ ...base, slug: 'Bad Slug!' }).success).toBe(false);
    expect(workFormSchema.safeParse({ ...base, vimeo_id: 'abc' }).success).toBe(false);
  });
  it('rejects descriptions over 300 characters', () => {
    expect(workFormSchema.safeParse({ ...base, short_description: 'x'.repeat(301) }).success).toBe(false);
  });
  it('rejects invalid aspect ratios', () => {
    expect(workFormSchema.safeParse({ ...base, aspect: '3:2' }).success).toBe(false);
  });
});

describe('workImportFileSchema', () => {
  it('accepts the documented export shape', () => {
    const file = {
      version: 1,
      categories: [{ slug: 'fashion', name: 'Fashion', sort_order: 6 }],
      works: [{
        slug: 'summer-drop', title: 'Summer Drop', vimeo_id: '123456789', aspect: '9:16',
        duration_sec: 30, thumbnail_url: 'https://example.com/t.jpg', category_slug: 'fashion',
        client_name: 'Gentle Park', industry: 'Fashion', year: 2026,
        short_description: 'A launch film.', tags: ['fashion'], featured: false, published: true, sort_order: 1,
        services: [{ service_slug: 'ai-commercial-30s', position: 0 }],
        case_study: { is_sample: true, overview: 'Demo', metrics: [{ label: 'Watch time', value: '+40%' }] },
      }],
    };
    const parsed = workImportFileSchema.safeParse(file);
    expect(parsed.success).toBe(true);
  });
  it('rejects a wrong version', () => {
    expect(workImportFileSchema.safeParse({ version: 2, works: [] }).success).toBe(false);
  });
  it('applies defaults for optional work fields', () => {
    const parsed = workImportWorkSchema.parse({ slug: 'a', title: 'A', vimeo_id: '1', aspect: '1:1' });
    expect(parsed.tags).toEqual([]);
    expect(parsed.published).toBe(true);
    expect(parsed.services).toEqual([]);
  });
});

describe('fieldErrors', () => {
  it('maps issues to their field paths', () => {
    const result = workFormSchema.safeParse({ slug: '', title: '' });
    if (result.success) throw new Error('expected failure');
    const errors = fieldErrors(result.error);
    expect(errors['slug']).toBeTruthy();
    expect(errors['title']).toBeTruthy();
  });
});
