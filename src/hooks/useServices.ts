import { publishedServices, servicePriceLine } from '@/data/services';
// Keep existing pricing, portfolio and booking consumers on their familiar shape.
export type Service = { id: string; slug: string; family: string; name: string; description: string; deliverables: string[]; formats: string[]; turnaround: string; price: string };
export const useServices = () => ({
  data: publishedServices().map(service => ({
    id: service.slug, slug: service.slug, family: service.category, name: service.name,
    description: service.shortDescription, deliverables: service.whatYouGet,
    formats: service.formats.split(', '), turnaround: service.delivery, price: servicePriceLine(service),
  })), loading: false, error: null,
});
