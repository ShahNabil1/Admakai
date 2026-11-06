import { describe, expect, it } from 'vitest';
import { findPublishedService, services } from './services';
const supplied = [
  ['ai-commercial-30s', 290, 440, 'project'],
  ['ai-commercial-60s', 460, 680, 'project'],
  ['ai-ugc-ads', 70, 250, 'project'],
  ['ad-variant-pack', 85, 220, 'project'],
  ['product-film', 140, 250, 'project'],
  ['saas-explainer', 220, 330, 'project'],
  ['cgi-product-commercial', 140, 260, 'project'],
  ['festival-campaign-pack', 340, 590, 'project'],
  ['ai-storyboard-animatic', 95, 170, 'project'],
  ['ai-product-photoshoot', 50, 85, 'product'],
  ['fashion-film-lookbook', 290, 450, 'project'],
  ['ai-brand-model', 75, 140, 'project'],
  ['virtual-try-on', 35, 70, 'product'],
  ['ecommerce-catalogue-pack', 55, 95, 'pack of 20 products'],
  ['static-ad-creative-pack', 85, 140, 'project'],
  ['3d-product-360', 70, 140, 'product'],
  ['digital-clone', 140, 220, 'month'],
  ['ai-presenter-video', 110, 170, 'video'],
  ['training-video', 95, 150, 'module'],
  ['ai-brand-ambassador', 230, 390, 'month'],
  ['ai-corporate-headshots', 15, 25, 'person'],
  ['reels-pack-of-6', 170, 370, 'pack of 6'],
  ['ai-video-editing', 15, 30, 'minute'],
  ['motion-ad-logo-animation', 45, 90, 'project'],
  ['explainer-motion-graphics', 190, 330, 'project'],
  ['long-to-short-repurposing', 70, 120, 'project'],
  ['corporate-avc-event-video', 280, 580, 'project'],
  ['youtube-channel-pack', 70, 110, 'project'],
  ['monthly-content-subscription', 550, 950, 'month'],
  ['ai-voiceover', 15, 20, 'minute'],
  ['dubbing-lip-sync', 25, 50, 'minute'],
  ['jingle-sonic-logo', 70, 120, 'project'],
  ['custom-ad-music', 25, 45, 'track'],
  ['audio-ad-ivr', 30, 60, 'project'],
  ['creative-strategy-hook-research', 70, 120, 'project'],
  ['ad-performance-review', 80, 120, 'month'],
  ['ai-mascot-brand-character', 110, 190, 'project'],
] as const;
describe('exact owner-supplied price ranges', () => {
  it('prices all 37 services with no extra or missing slugs', () => expect(services.map(service => service.slug).sort()).toEqual(supplied.map(row => row[0]).sort()));
  it.each(supplied)('preserves %s minimum, maximum and unit', (slug, min, max, unit) => {
    expect(findPublishedService(slug)).toMatchObject({ priceMinUsd: min, priceMaxUsd: max, priceUnit: unit });
  });
});
