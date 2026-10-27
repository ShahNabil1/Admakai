import { describe, expect, it } from 'vitest';
import { canonicalUrl, monthlyPlanSchema, organizationSchema } from './seo';
import { publicSeoPaths } from '@/data/seo-routes';
describe('SEO business rules', () => {
  it('uses the production domain without trailing slashes or query fragments', () => { expect(canonicalUrl('/work/?type=case-study#top')).toBe('https://admakai.com/work'); });
  it('records Branta Tech as parent organization', () => { expect(organizationSchema().parentOrganization).toEqual({ '@type': 'Organization', name: 'Branta Tech' }); });
  it('records 2026 as founding date', () => { expect(organizationSchema().foundingDate).toBe('2026'); });
  it('records Dhaka Bangladesh as the studio address', () => { expect(organizationSchema().address).toEqual({ '@type': 'PostalAddress', addressLocality: 'Dhaka', addressCountry: 'BD' }); });
  it('does not publish an offer for the unconfigured monthly price', () => { expect(monthlyPlanSchema()).not.toHaveProperty('offers'); });
  it('does not expose admin destinations in the sitemap', () => { expect(publicSeoPaths.some(path => path.startsWith('/admin'))).toBe(false); });
});