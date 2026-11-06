import { describe, expect, it } from 'vitest';
import { services, serviceCategories } from './services';
import { portfolioDefaults, servicePortfolio, playingPreviews } from './portfolioDefaults';
import { proof } from './proof';
import { useCases, serviceDeliveryTerms } from './useCases';

describe('service landing rules', () => {
  it('offers two revision rounds', () => expect(serviceDeliveryTerms.revisionRounds).toBe(2));
  it('offers 48-hour rush delivery', () => expect(serviceDeliveryTerms.rushHours).toBe(48));
  it('charges 25 percent extra for rush delivery', () => expect(serviceDeliveryTerms.rushExtraPercent).toBe(25));
  it('has no invented proof', () => expect(Object.keys(proof)).toHaveLength(0));
  it('starts all category portfolios empty', () => { for (const category of serviceCategories) expect(portfolioDefaults[category.id]).toEqual([]); });
  it('provides six use cases per service category', () => { for (const service of services) expect(useCases[service.category]).toHaveLength(6); });
  it('falls back to category videos only when service videos are absent', () => {
    const base = services[0]; if (!base) throw new Error('Missing service');
    const video = { vimeoId: '123456', aspect: '9:16' as const, title: 'Supplied video' };
    expect(servicePortfolio({ ...base, portfolio: [video] })).toEqual([video]);
    expect(servicePortfolio({ ...base, portfolio: [] })).toEqual([]);
  });
  it('never permits more than four unique autoplay previews', () => expect(playingPreviews([5, 4, 3, 2, 1, 1, 0])).toEqual([0, 1, 2, 3]));
});