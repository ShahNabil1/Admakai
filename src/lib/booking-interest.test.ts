import { describe, expect, it } from 'vitest';
import { categoryServices, emptyInterest, interestFromSearch, interestName, legacyBookingNeed, legacyServiceHashes, savedInterest } from './booking-interest';
import { serviceCategories } from '@/data/services';
describe('Connected booking interests', () => {
  it('preselects a published service and its category', () => expect(interestFromSearch({service:'ai-ugc-ads'})).toEqual({category:'video-ads',service:'ai-ugc-ads',plan:''}));
  for (const plan of ['starter','growth','scale']) {
    it(`preselects ${plan}`, () => expect(interestFromSearch({plan})).toEqual({category:'monthly',service:'',plan}));
  }
  it('ignores unknown URL choices', () => expect(interestFromSearch({service:'missing',plan:'missing'})).toEqual(emptyInterest));
  it('retains a known service if the plan is unknown', () => expect(interestFromSearch({service:'ai-voiceover',plan:'missing'}).service).toBe('ai-voiceover'));
  it('lists all six categories from the catalogue', () => expect(serviceCategories.map(category=>category.id)).toEqual(['video-ads','imagery','people','social','voice','strategy']));
  it('optional service list contains only the chosen category', () => expect(categoryServices('voice').map(service=>service.slug)).toEqual(['ai-voiceover','dubbing-lip-sync','jingle-sonic-logo','custom-ad-music','audio-ad-ivr']));
  it('uses a service name from the catalogue', () => expect(interestName(interestFromSearch({service:'ai-ugc-ads'}))).toBe('AI UGC Ads'));
  it('uses the selected plan name', () => expect(interestName(interestFromSearch({plan:'growth'}))).toBe('Growth'));
  it('preserves database need-code compatibility', () => expect(legacyBookingNeed(interestFromSearch({service:'ai-voiceover'}))).toBe('unsure'));
  it('CRM can recover the exact saved service from the message', () => expect(savedInterest('Interested in: AI UGC Ads\nPlease help with an ad.')).toBe('AI UGC Ads'));
  for (const [hash,slug] of Object.entries({
    'ai-commercials':'ai-commercial-30s','ai-ugc-ads':'ai-ugc-ads','ai-product-photoshoot':'ai-product-photoshoot',
    'brand-models-digital-clones':'ai-brand-model','brand-models-and-clones':'ai-brand-model',
    'ai-voice-dubbing':'ai-voiceover','ai-voice-and-dubbing':'ai-voiceover','motion-logo-animation':'motion-ad-logo-animation',
    'fashion-films-lookbooks':'fashion-film-lookbook','ad-variants-localisation':'ad-variant-pack',
  })) it(`redirects legacy ${hash}`,()=>expect(legacyServiceHashes[hash]).toBe(slug));
});