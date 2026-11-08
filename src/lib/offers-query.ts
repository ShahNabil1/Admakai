import { queryOptions } from '@tanstack/react-query';
import { getLiveOffers } from './offers.functions';
export const liveOffersQueryKey = ['live-offers'] as const;
/** Short freshness plus a background refresh so switching an offer on or off shows up without a redeploy. */
export const liveOffersQueryOptions = queryOptions({ queryKey: liveOffersQueryKey, queryFn: () => getLiveOffers(), staleTime: 10_000, refetchInterval: 60_000, refetchOnWindowFocus: true });
