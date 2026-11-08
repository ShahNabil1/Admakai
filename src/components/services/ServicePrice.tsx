import type { Service } from '@/data/services';
import { OfferRange } from '@/components/offers/OfferPrice';
/** Shared service estimate; a live offer adds its badge, struck original and discounted range on top of the stored price. */
export function ServicePrice({ service }: { service: Service }) {
  return <OfferRange kind="service" slug={service.slug} minUsd={service.priceMinUsd} maxUsd={service.priceMaxUsd} prefix="Estimated price: " suffix={service.priceUnit !== 'project' ? ` per ${service.priceUnit}` : ''} />;
}
