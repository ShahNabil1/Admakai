import { findPublishedService, publishedServices, serviceCategories } from '@/data/services';
import { plans } from '@/data/plans';
import type { BookingFields } from './booking-form';

export type BookingInterest = { category: string; service: string; plan: string };
export const emptyInterest: BookingInterest = { category: '', service: '', plan: '' };
export function interestFromSearch(search: { service?: string; plan?: string }): BookingInterest {
  const plan = plans.find(item => item.id === search.plan);
  if (plan) return { category: 'monthly', service: '', plan: plan.id };
  const service = findPublishedService(search.service ?? '');
  return service ? { category: service.category, service: service.slug, plan: '' } : emptyInterest;
}
export function interestName(interest: BookingInterest): string {
  if (interest.category === 'monthly') return plans.find(plan => plan.id === interest.plan)?.name ?? 'Monthly plan';
  return findPublishedService(interest.service)?.name ?? serviceCategories.find(category => category.id === interest.category)?.name ?? 'Not sure yet';
}
// Preserve the database's existing five need codes; store the exact requested interest in its message.
export function legacyBookingNeed(interest: BookingInterest): BookingFields['need'] {
  if (interest.service === 'ai-ugc-ads') return 'ugc';
  if (interest.category === 'video-ads') return 'tvc';
  if (interest.category === 'imagery') return 'product_photos';
  if (interest.category === 'people' || interest.service === 'ai-mascot-brand-character') return 'brand_face';
  return 'unsure';
}
export function interestedMessage(name: string, message: string) { return `Interested in: ${name}\n${message}`.trim(); }
export function savedInterest(message: string) { return /^Interested in: ([^\r\n]+)/.exec(message)?.[1] ?? ''; }
export function categoryServices(category: string) { return publishedServices().filter(service => service.category === category); }
export const legacyServiceHashes: Record<string, string> = {
  'ai-commercials': 'ai-commercial-30s', 'ai-ugc-ads': 'ai-ugc-ads', 'ai-product-photoshoot': 'ai-product-photoshoot',
  'brand-models-digital-clones': 'ai-brand-model', 'brand-models-and-clones': 'ai-brand-model',
  'ai-voice-dubbing': 'ai-voiceover', 'ai-voice-and-dubbing': 'ai-voiceover',
  'motion-logo-animation': 'motion-ad-logo-animation', 'fashion-films-lookbooks': 'fashion-film-lookbook',
  'ad-variants-localisation': 'ad-variant-pack',
};