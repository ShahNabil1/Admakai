import { publishedServices } from '@/data/services';
import { useCurrency } from '@/lib/currency';
// Keep existing pricing, portfolio and booking consumers on their familiar shape.
export type Service = { id: string; slug: string; family: string; name: string; description: string; deliverables: string[]; formats: string[]; turnaround: string; price: string };
export const useServices = () => {
  const { formatRange } = useCurrency();
  return ({
  data: publishedServices().map(service => ({
    id: service.slug, slug: service.slug, family: service.category, name: service.name,
    description: service.shortDescription, deliverables: service.whatYouGet,
    formats: service.formats.split(', '), turnaround: service.delivery, price: `Estimated price: ${formatRange(service.priceMinUsd, service.priceMaxUsd)}${service.priceUnit === 'project' ? '' : ` per ${service.priceUnit}`}`,
  })), loading: false, error: null,
});
};
