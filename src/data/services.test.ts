import { describe, expect, it } from 'vitest';
import { findPublishedService, publishedServices, relatedServices, services, visibleCategories, servicePriceLine } from './services';
import { publicSeoPaths, prerenderPaths } from './seo-routes';

describe('Static service catalogue rules', () => {
  it('starts with all 29 supplied services published', () => expect(publishedServices()).toHaveLength(29));
  it('leaves all supplied prices unconfigured', () => expect(services.map(service => service.priceFrom)).toEqual(Array(29).fill(null)));
  it('shows only the four populated categories in supplied order', () => expect(visibleCategories().map(category => category.id)).toEqual(['video-ads','imagery','people','social']));
  it('publishes all five supplied people services', () => expect(publishedServices().filter(service => service.category === 'people').map(service => service.slug)).toEqual(['digital-clone', 'ai-presenter-video', 'training-video', 'ai-brand-ambassador', 'ai-corporate-headshots']));
  it('publishes all eight supplied social services', () => expect(publishedServices().filter(service => service.category === 'social').map(service => service.slug)).toEqual(['reels-pack-of-6', 'ai-video-editing', 'motion-ad-logo-animation', 'explainer-motion-graphics', 'long-to-short-repurposing', 'corporate-avc-event-video', 'youtube-channel-pack', 'monthly-content-subscription']));
  it('keeps digital clone monthly with a five-day setup', () => expect(findPublishedService('digital-clone')).toMatchObject({ pricing: 'monthly', delivery: '5 days setup', priceFrom: null }));
  it('prices AI video editing per minute with three-day delivery', () => expect(findPublishedService('ai-video-editing')).toMatchObject({ pricing: 'per-minute', delivery: '3 days', priceFrom: null }));
  it('hides an unpublished service from index results', () => {
    const source = services.map(service => ({ ...service, published: service.slug !== 'ai-commercial-30s' }));
    expect(publishedServices(source).map(service => service.slug)).not.toContain('ai-commercial-30s');
    expect(publishedServices(source)).toHaveLength(28);
  });
  it('does not resolve an unpublished detail page', () => {
    const service = findPublishedService('ai-commercial-30s');
    if (!service) throw new Error('Missing supplied service');
    expect(findPublishedService('ai-commercial-30s', [{ ...service, published: false }])).toBeUndefined();
  });
  it('does not resolve an unknown slug', () => expect(findPublishedService('missing-service')).toBeUndefined());
  it('omits unavailable future related services', () => {
    const service = findPublishedService('ai-commercial-60s');
    if (!service) throw new Error('Missing supplied service');
    expect(relatedServices(service).map(item => item.slug)).toEqual(['ai-commercial-30s', 'corporate-avc-event-video']);
  });
  it('omits unpublished related services', () => {
    const service = findPublishedService('ai-commercial-30s');
    if (!service) throw new Error('Missing supplied service');
    expect(relatedServices(service, services.map(item => ({ ...item, published: item.slug !== 'ai-commercial-60s' }))).map(item => item.slug)).toEqual(['cgi-product-commercial']);
  });
  it('keeps published detail destinations in the crawl inventory', () => { for (const service of services) expect(publicSeoPaths).toContain(`/services/${service.slug}`); });
  it('prerenders every published service detail', () => { for (const service of services) expect(prerenderPaths).toContain(`/services/${service.slug}`); });
  it('does not invent an amount for quotes', () => expect(servicePriceLine({ pricing: 'quote', priceFrom: null })).toBe('Get a quote'));
  it('preserves per-minute pricing when the amount is unset', () => expect(servicePriceLine({ pricing: 'per-minute', priceFrom: null })).toBe('Priced per minute'));
  it('preserves monthly pricing when the amount is unset', () => expect(servicePriceLine({ pricing: 'monthly', priceFrom: null })).toBe('Monthly plan'));
});