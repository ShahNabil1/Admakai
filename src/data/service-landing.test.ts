import { describe, expect, it } from 'vitest';
import { services } from './services';
import { portfolioDefaults, servicePortfolio, playingPreviews } from './portfolioDefaults';
import { proof } from './proof';
import { useCases, serviceDeliveryTerms } from './useCases';

describe('service landing rules', () => {
  it('offers two revision rounds', () => expect(serviceDeliveryTerms.revisionRounds).toBe(2));
  it('offers 48-hour rush delivery', () => expect(serviceDeliveryTerms.rushHours).toBe(48));
  it('charges 25 percent extra for rush delivery', () => expect(serviceDeliveryTerms.rushExtraPercent).toBe(25));
  it('has no invented proof', () => expect(Object.keys(proof)).toHaveLength(0));
  it.each([
    ['ai-commercial-30s', ["1183677915", "1205217563", "1183677848", "1232728534", "1183677731"]],
    ['ai-commercial-60s', ["1244169947", "1232739772", "1244169945", "1211611248", "1211608926", "1211608973"]],
    ['ai-ugc-ads', ["1205218185", "1205218183"]],
    ['ad-variant-pack', ["1205218646", "1205218659", "1205218265", "1205216888"]],
    ['product-film', ["1183677731", "1232739772", "1211611248", "1211608803", "1167294176"]],
    ['saas-explainer', ["1167294176", "1211611158", "1232958393", "1232979935"]],
    ['cgi-product-commercial', ["1211608803", "1205217563", "1205218184", "1205217546", "1211608606", "1205219023", "1205217544", "1205218268"]],
    ['festival-campaign-pack', ["1205218002", "1205217996", "1205216888"]],
    ['ai-product-photoshoot', ["1232958393", "1205218926", "1205218742", "1205218794", "1205218784", "1205218394", "1205218583"]],
    ['fashion-film-lookbook', ["1232801694", "1232801730", "1232801813", "1232801512", "1232801679", "1232801675", "1232801612", "1232801572"]],
    ['ai-brand-model', ["1232801830", "1232801709", "1232801622", "1232801648"]],
    ['virtual-try-on', ["1232801853", "1232801511", "1232801694", "1232801709"]],
    ['static-ad-creative-pack', ["1205217157", "1205218396", "1205218727", "1205218711", "1205218677", "1205218923"]],
    ['digital-clone', ["1244171290", "1244171284"]],
    ['ai-presenter-video', ["1211608608", "1211608609", "1244171284"]],
    ['ai-brand-ambassador', ["1211608609", "1211608608", "1244171290"]],
    ['reels-pack-of-6', ["1211608606", "1205219023", "1205218184", "1211608803", "1232801813", "1205218183"]],
    ['ai-video-editing', ["1244169944", "1211608973"]],
    ['motion-ad-logo-animation', ["1232974660", "1205218743", "1232979935", "1205218267"]],
    ['explainer-motion-graphics', ["1211609079", "1232958393", "1167621946", "1211611158"]],
    ['corporate-avc-event-video', ["1244169944", "1244169945"]],
    ['youtube-channel-pack', ["1244171290", "1244171284"]],
    ['monthly-content-subscription', ["1205218727", "1205218185", "1232801813", "1205218002", "1211608606", "1205218784"]],
    ['ai-mascot-brand-character', ["1211611161", "1211611248", "1211609079"]],
  ])('keeps the supplied service video order for %s', (slug, ids) => {
    expect(services.find(service => service.slug === slug)?.portfolio?.map(item => item.vimeoId)).toEqual(ids);
  });
  it('leaves every supplied client empty', () => {
    const items = [...services.flatMap(service => service.portfolio ?? []), ...Object.values(portfolioDefaults).flat()];
    expect(items).toHaveLength(119);
    for (const item of items) expect(item.client).toBe('');
  });
  it('provides six use cases per service category', () => { for (const service of services) expect(useCases[service.category]).toHaveLength(6); });
  it('falls back to category videos only when service videos are absent', () => {
    const base = services[0]; if (!base) throw new Error('Missing service');
    const video = { vimeoId: '123456', aspect: '9:16' as const, title: 'Supplied video' };
    expect(servicePortfolio({ ...base, portfolio: [video] })).toEqual([video]);
    expect(servicePortfolio({ ...base, portfolio: [] })).toEqual(portfolioDefaults[base.category]);
    const { portfolio, ...withoutPortfolio } = base;
    expect(servicePortfolio(withoutPortfolio)).toEqual(portfolioDefaults[base.category]);
  });
  it('never permits more than four unique autoplay previews', () => expect(playingPreviews([5, 4, 3, 2, 1, 1, 0])).toEqual([0, 1, 2, 3]));
});