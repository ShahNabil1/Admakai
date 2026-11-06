import { publishedServices, services, type Service } from './services';

export const serviceGoals = [
  { id: 'all', label: 'All services' },
  { id: 'sales', label: 'Sell more with ads' },
  { id: 'launch', label: 'Launch a new product' },
  { id: 'fashion', label: 'Fashion and clothing' },
  { id: 'ecom', label: 'Online shop and Facebook commerce' },
  { id: 'tech', label: 'Software, apps and SaaS' },
  { id: 'brand', label: 'Build brand recognition' },
  { id: 'festival', label: 'Festival offers' },
  { id: 'edu', label: 'Training and education' },
  { id: 'corp', label: 'Corporate, banks and NGOs' },
  { id: 'creator', label: 'Personal brand and creators' },
] as const;

export type ServiceGoal = typeof serviceGoals[number]['id'];
export function toggleServiceGoal(current: ServiceGoal, clicked: ServiceGoal): ServiceGoal {
  return current === clicked ? 'all' : clicked;
}
export function filterServicesByGoal(goal: ServiceGoal, source: Service[] = services) {
  return publishedServices(source).filter(service => goal === 'all' || service.goals.includes(goal));
}