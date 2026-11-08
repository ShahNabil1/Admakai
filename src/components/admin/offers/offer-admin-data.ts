import type { readOffersAdmin } from '@/lib/offers.functions';
import { isScope, type OverlapOffer } from '@/lib/offer-rules';

export type OffersAdminData = Awaited<ReturnType<typeof readOffersAdmin>>;
export type OfferRow = OffersAdminData['offers'][number];
type OverlapSource = Pick<OfferRow, 'id' | 'name' | 'priority' | 'starts_at' | 'ends_at' | 'is_active' | 'applies_to' | 'selected_service_ids' | 'selected_plan_ids'>;

/** Admin rows reduced to what the overlap check needs; selected ids are used directly as item keys. */
export function adminOfferToOverlap(o: OverlapSource): OverlapOffer {
  return {
    id: o.id, name: o.name, priority: o.priority, startsAt: o.starts_at, endsAt: o.ends_at, isActive: o.is_active,
    appliesTo: isScope(o.applies_to) ? o.applies_to : 'everything', serviceSlugs: o.selected_service_ids, planSlugs: o.selected_plan_ids,
  };
}
