import type { Service } from '@/data/services';
import { useCurrency } from '@/lib/currency';
export function ServicePrice({ service }: { service: Service }) {
  const { formatRange } = useCurrency();
  return <>Estimated price: {formatRange(service.priceMinUsd, service.priceMaxUsd)}{service.priceUnit !== 'project' ? ` per ${service.priceUnit}` : ''}</>;
}