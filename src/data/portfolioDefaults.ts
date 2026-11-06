import type { Service, ServicePortfolioItem } from './services';

export const portfolioDefaults: Record<string, ServicePortfolioItem[]> = {
  'video-ads': [], imagery: [], people: [], social: [], voice: [], strategy: [],
};
export function servicePortfolio(service: Service): ServicePortfolioItem[] {
  return service.portfolio?.length ? service.portfolio : portfolioDefaults[service.category] ?? [];
}
export function portfolioTags(items: ServicePortfolioItem[]) {
  return [...new Set(items.flatMap(item => item.tag ? [item.tag] : []))];
}
export function playingPreviews(visible: number[]) { return [...new Set(visible)].sort((a, b) => a - b).slice(0, 4); }