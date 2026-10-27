export type Capability = { slug: string; title: string; copy: string; video: string; poster: string; label: string };

const items: Array<Omit<Capability, 'video' | 'poster'>> = [
  { slug: 'ai-commercials', title: 'AI Commercials', copy: '15 to 60 second ads with locked characters, locations and light, graded like a TVC.', label: 'AI commercial example by Admakai' },
  { slug: 'ai-ugc-ads', title: 'AI UGC Ads', copy: 'Creator style hook videos, 3 to 10 variants per script, no creators to manage.', label: 'AI UGC ad example by Admakai' },
  { slug: 'ai-product-photoshoot', title: 'AI Product Photoshoot', copy: 'Studio, lifestyle and seasonal shots from one photo of your product.', label: 'AI product photoshoot example by Admakai' },
  { slug: 'brand-models-digital-clones', title: 'Brand Models and Digital Clones', copy: 'A consistent AI model for your brand, or your own face and voice cloned for presenter videos.', label: 'AI brand model example by Admakai' },
  { slug: 'ai-voice-dubbing', title: 'AI Voice and Dubbing', copy: 'Bangla and English voiceover, lip synced dubbing into any language.', label: 'AI voice and dubbing example by Admakai' },
  { slug: 'motion-logo-animation', title: 'Motion and Logo Animation', copy: 'Kinetic type, logo reveals and product films that move like premium software ads.', label: 'Motion and logo animation example by Admakai' },
  { slug: 'fashion-films-lookbooks', title: 'Fashion Films and Lookbooks', copy: 'Runway style films and full lookbooks without a model day rate.', label: 'AI fashion film example by Admakai' },
  { slug: 'ad-variants-localisation', title: 'Ad Variants and Localisation', copy: 'One master ad turned into 10 formats, hooks and languages for testing.', label: 'AI ad variants example by Admakai' },
];

export const capabilities: Capability[] = items.map((c, i) => ({
  ...c,
  video: `/capabilities/cap-${i + 1}.mp4`,
  poster: `/capabilities/cap-${i + 1}.jpg`,
}));
