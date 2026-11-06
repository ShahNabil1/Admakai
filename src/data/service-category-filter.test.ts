import { describe, expect, it } from 'vitest';
import { filterServicesByCategory } from './service-category-filter';
import { services } from './services';

describe('Service catalogue category tabs', () => {
  it('All includes the 37 published services', () => expect(filterServicesByCategory('all')).toHaveLength(37));
  it('Video selects video ads only', () => {
    expect(filterServicesByCategory('video-ads').map(service => service.slug)).toEqual(services.filter(service => service.published && service.category === 'video-ads').map(service => service.slug));
    expect(filterServicesByCategory('video-ads').length).toBeGreaterThan(0);
  });
  it.each(['imagery', 'people', 'social', 'voice', 'strategy'] as const)('%s selects only its category', category => {
    const matches = filterServicesByCategory(category);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every(service => service.category === category)).toBe(true);
  });
  it('category selection excludes unpublished services', () => {
    const source = services.map(service => ({ ...service, published: service.slug !== 'ai-commercial-30s' }));
    expect(filterServicesByCategory('video-ads', source).map(service => service.slug)).not.toContain('ai-commercial-30s');
    expect(filterServicesByCategory('all', source)).toHaveLength(36);
  });
});