import { findPublishedService, type Service } from './services';
export type Capability = Service & { title: string; copy: string; video: string; poster: string; label: string };
export const homeServiceSlugs = [
  'ai-commercial-30s', 'ai-ugc-ads', 'ai-product-photoshoot', 'ai-brand-model',
  'ai-voiceover', 'motion-ad-logo-animation', 'fashion-film-lookbook', 'ad-variant-pack',
];
export const capabilities: Capability[] = homeServiceSlugs.flatMap((slug, i) => {
  const service = findPublishedService(slug);
  return service ? [{ ...service, title: service.name, copy: service.shortDescription,
    video: `/capabilities/cap-${i + 1}.mp4`, poster: `/capabilities/cap-${i + 1}.jpg`, label: `${service.name} example by Admakai` }] : [];
});
