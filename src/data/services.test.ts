import { describe, expect, it } from 'vitest';
import { findPublishedService, publishedServices, relatedServices, services, visibleCategories, serviceCardFigure } from './services';
import { publicSeoPaths, prerenderPaths } from './seo-routes';

describe('Static service catalogue rules', () => {
  it('features only the four requested services', () => expect(services.filter(service => service.featured).map(service => service.slug)).toEqual(['ai-commercial-30s', 'ai-ugc-ads', 'virtual-try-on', 'reels-pack-of-6']));
  it.each([['7 days', '7 days'], ['5 days setup', '5 days'], ['Monthly', 'Monthly']])('preserves delivery figure %s', (delivery, figure) => expect(serviceCardFigure({ delivery })).toEqual({ figure, caption: 'delivery' }));
  it('starts with all 37 supplied services published', () => expect(publishedServices()).toHaveLength(37));
  it('shows all six populated categories in supplied order', () => expect(visibleCategories().map(category => category.id)).toEqual(['video-ads','imagery','people','social','voice','strategy']));
  it('publishes the five supplied voice services', () => expect(publishedServices().filter(service => service.category === 'voice').map(service => service.slug)).toEqual(['ai-voiceover', 'dubbing-lip-sync', 'jingle-sonic-logo', 'custom-ad-music', 'audio-ad-ivr']));
  it('publishes the three supplied strategy services', () => expect(publishedServices().filter(service => service.category === 'strategy').map(service => service.slug)).toEqual(['creative-strategy-hook-research', 'ad-performance-review', 'ai-mascot-brand-character']));
  it.each([
    ['ai-voiceover', 'per-minute', '2 days'],
    ['dubbing-lip-sync', 'per-minute', '3 days'],
    ['jingle-sonic-logo', 'quote', '4 days'],
    ['custom-ad-music', 'quote', '2 days'],
    ['audio-ad-ivr', 'quote', '2 days'],
    ['creative-strategy-hook-research', 'quote', '3 days'],
    ['ad-performance-review', 'monthly', 'Monthly'],
    ['ai-mascot-brand-character', 'quote', '5 days'],
  ])('preserves %s pricing and delivery', (slug, pricing, delivery) => expect(findPublishedService(slug)).toMatchObject({ pricing, delivery }));
  it('resolves every related slug to a published service', () => {
    for (const service of services) {
      expect(relatedServices(service).map(item => item.slug)).toEqual(service.related);
    }
  });
  it.each(services.map(service => [service.slug]))('hides unpublished %s from all catalogue destinations', (slug) => {
    const source = services.map(service => ({ ...service, published: service.slug !== slug }));
    expect(publishedServices(source)).toHaveLength(36);
    expect(publishedServices(source).some(service => service.slug === slug)).toBe(false);
    expect(findPublishedService(slug, source)).toBeUndefined();
    for (const service of source) expect(relatedServices(service, source).some(item => item.slug === slug)).toBe(false);
  });
  it('publishes all five supplied people services', () => expect(publishedServices().filter(service => service.category === 'people').map(service => service.slug)).toEqual(['digital-clone', 'ai-presenter-video', 'training-video', 'ai-brand-ambassador', 'ai-corporate-headshots']));
  it('publishes all eight supplied social services', () => expect(publishedServices().filter(service => service.category === 'social').map(service => service.slug)).toEqual(['reels-pack-of-6', 'ai-video-editing', 'motion-ad-logo-animation', 'explainer-motion-graphics', 'long-to-short-repurposing', 'corporate-avc-event-video', 'youtube-channel-pack', 'monthly-content-subscription']));
  it('keeps digital clone monthly with a five-day setup', () => expect(findPublishedService('digital-clone')).toMatchObject({ pricing: 'monthly', delivery: '5 days setup' }));
  it('prices AI video editing per minute with three-day delivery', () => expect(findPublishedService('ai-video-editing')).toMatchObject({ pricing: 'per-minute', delivery: '3 days' }));
  it('hides an unpublished service from index results', () => {
    const source = services.map(service => ({ ...service, published: service.slug !== 'ai-commercial-30s' }));
    expect(publishedServices(source).map(service => service.slug)).not.toContain('ai-commercial-30s');
    expect(publishedServices(source)).toHaveLength(36);
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
  it('renders editable catalogue pages on request instead of prerendering them', () => { for (const path of ['/', '/services', '/pricing', ...services.map(service => `/services/${service.slug}`)]) expect(prerenderPaths).not.toContain(path); });
});