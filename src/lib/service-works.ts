import { queryOptions } from '@tanstack/react-query';
import { services } from '@/data/services';
import { getWorksForService, listPublishedWorks, type WorkWithLinks } from './works';

export const SERVICE_FALLBACK_LIMIT = 6;

/** Other service slugs in the same catalogue category as `slug`. */
export function siblingServiceSlugs(slug: string): string[] {
  const category = services.find(service => service.slug === slug)?.category;
  if (!category) return [];
  return services.filter(service => service.category === category && service.slug !== slug).map(service => service.slug);
}

/** Direct links win; otherwise up to six published works linked to sibling services, featured first. */
export function pickServiceWorks(slug: string, direct: WorkWithLinks[], published: WorkWithLinks[]): WorkWithLinks[] {
  const own = direct.filter(work => work.published);
  if (own.length) return own;
  const siblings = new Set(siblingServiceSlugs(slug));
  return published
    .filter(work => work.published && work.work_services.some(link => siblings.has(link.service_slug)))
    .sort((a, b) => Number(b.featured) - Number(a.featured) || a.sort_order - b.sort_order)
    .slice(0, SERVICE_FALLBACK_LIMIT);
}

export async function getServicePortfolioWorks(slug: string): Promise<WorkWithLinks[]> {
  const direct = (await getWorksForService(slug)).filter(work => work.published);
  if (direct.length) return direct;
  return pickServiceWorks(slug, [], await listPublishedWorks());
}

export const servicePortfolioWorksQueryOptions = (slug: string) => queryOptions({
  queryKey: ['works', 'service-portfolio', slug],
  queryFn: () => getServicePortfolioWorks(slug).catch(() => [] as WorkWithLinks[]),
  staleTime: 60_000,
});
