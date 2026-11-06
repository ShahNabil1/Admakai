import { publishedServices, services, type Service } from './services';

export const serviceCategoryTabs = [
  { id: 'all', label: 'All' },
  { id: 'video-ads', label: 'Video' },
  { id: 'imagery', label: 'Imagery' },
  { id: 'people', label: 'People' },
  { id: 'social', label: 'Social' },
  { id: 'voice', label: 'Voice' },
  { id: 'strategy', label: 'Strategy' },
] as const;
export type ServiceCategoryFilter = typeof serviceCategoryTabs[number]['id'];
export function filterServicesByCategory(category: ServiceCategoryFilter, source: Service[] = services) {
  return publishedServices(source).filter(service => category === 'all' || service.category === category);
}