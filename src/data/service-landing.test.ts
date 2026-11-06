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
    ['video-ads', ['1183677915', '1183677848', '1211608926', '1205218185']],
    ['imagery', ['1205218979', '1205218971', '1232801813', '1205218964']],
    ['people', ['1211608608', '1211608607']],
    ['social', ['1211611228', '1205218586', '1232974660', '1205218183']],
    ['voice', []], ['strategy', []],
  ])('uses supplied category videos for %s', (category, ids) => {
    expect(portfolioDefaults[String(category)]?.map(item => item.vimeoId)).toEqual(ids);
  });
  it.each([
    ['ai-commercial-30s', ['1183677915', '1183677848', '1183677731', '1232728534']],
    ['ai-commercial-60s', ['1211608926', '1211608973', '1211611227']],
    ['ai-ugc-ads', ['1205218185', '1205218183', '1211611161']],
    ['ad-variant-pack', ['1205218659', '1205218646', '1205218672']],
    ['product-film', ['1167294176', '1211611191']],
    ['saas-explainer', ['1167294176', '1211610013', '1211610012', '1211610011']],
    ['cgi-product-commercial', ['1211610010', '1211610107', '1205218184', '1205217546', '1211608606', '1205219023', '1211611247']],
    ['festival-campaign-pack', ['1205218002', '1205217998', '1205217996', '1205218795']],
    ['ai-product-photoshoot', ['1232958393', '1205218979', '1205218971', '1205218964', '1205218926', '1205218924', '1205218794']],
    ['fashion-film-lookbook', ['1232801813', '1232801730', '1232801694', '1232801679', '1232801648', '1232801512']],
    ['ai-brand-model', ['1232801830', '1232801709', '1232801622']],
    ['static-ad-creative-pack', ['1205217157', '1205218396', '1205218784', '1205218727']],
    ['ai-presenter-video', ['1211608608', '1211608607']],
    ['motion-ad-logo-animation', ['1232974660', '1211611236', '1232979935']],
    ['explainer-motion-graphics', ['1232958393', '1167621946', '1205218586', '1205218584', '1205218923']],
    ['reels-pack-of-6', ['1211611228', '1211611194', '1211611192', '1211611160', '1211611159', '1211609191']],
  ])('keeps the supplied service video order for %s', (slug, ids) => {
    expect(services.find(service => service.slug === slug)?.portfolio?.map(item => item.vimeoId)).toEqual(ids);
  });
  it('leaves every supplied client empty', () => {
    const items = [...services.flatMap(service => service.portfolio ?? []), ...Object.values(portfolioDefaults).flat()];
    expect(items).toHaveLength(80);
    for (const item of items) expect(item.client).toBe('');
  });
  it('provides six use cases per service category', () => { for (const service of services) expect(useCases[service.category]).toHaveLength(6); });
  it('falls back to category videos only when service videos are absent', () => {
    const base = services[0]; if (!base) throw new Error('Missing service');
    const video = { vimeoId: '123456', aspect: '9:16' as const, title: 'Supplied video' };
    expect(servicePortfolio({ ...base, portfolio: [video] })).toEqual([video]);
    expect(servicePortfolio({ ...base, portfolio: [] })).toEqual(portfolioDefaults[base.category]);
    expect(servicePortfolio({ ...base, portfolio: undefined })).toEqual(portfolioDefaults[base.category]);
  });
  it('never permits more than four unique autoplay previews', () => expect(playingPreviews([5, 4, 3, 2, 1, 1, 0])).toEqual([0, 1, 2, 3]));
});