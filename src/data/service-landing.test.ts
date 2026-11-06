import { describe, expect, it } from 'vitest';
import { services } from './services';
import { playingPreviews } from '@/components/services/portfolio-rules';
import { proof } from './proof';
import { useCases, serviceDeliveryTerms } from './useCases';

describe('service landing rules', () => {
  it('offers two revision rounds', () => expect(serviceDeliveryTerms.revisionRounds).toBe(2));
  it('offers 48-hour rush delivery', () => expect(serviceDeliveryTerms.rushHours).toBe(48));
  it('charges 25 percent extra for rush delivery', () => expect(serviceDeliveryTerms.rushExtraPercent).toBe(25));
  it('has no invented proof', () => expect(Object.keys(proof)).toHaveLength(0));
  it('keeps no hardcoded portfolio videos in the catalogue', () => { for (const service of services) expect('portfolio' in service).toBe(false); });
  it('provides six use cases per service category', () => { for (const service of services) expect(useCases[service.category]).toHaveLength(6); });
  it('never permits more than four unique autoplay previews', () => expect(playingPreviews([5, 4, 3, 2, 1, 1, 0])).toEqual([0, 1, 2, 3]));
});