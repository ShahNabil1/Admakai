import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { barOffer, featuredOffer, winningOffer, type PriceKind, type PublicOffer } from '@/lib/offer-rules';

type OfferContextValue = { offers: PublicOffer[]; now: number; offset: number };
const OfferContext = createContext<OfferContextValue>({ offers: [], now: 0, offset: 0 });

/**
 * Public offers plus a clock anchored to the server's time. The first render uses the server time so
 * server and browser markup match; afterwards the clock advances so an ending offer drops off by itself.
 */
export function OfferProvider({ offers, serverNow, children }: { offers: PublicOffer[]; serverNow: number; children: ReactNode }) {
  const [state, setState] = useState({ now: serverNow, offset: 0 });
  useEffect(() => {
    const offset = serverNow - Date.now();
    const tick = () => setState({ now: Date.now() + offset, offset });
    tick();
    const timer = window.setInterval(tick, 15_000);
    return () => window.clearInterval(timer);
  }, [serverNow]);
  const value = useMemo(() => ({ offers, now: state.now, offset: state.offset }), [offers, state]);
  return <OfferContext.Provider value={value}>{children}</OfferContext.Provider>;
}
/** Fixed offers and time, for the admin preview. */
export function OfferPreviewProvider({ offers, now, children }: { offers: PublicOffer[]; now: number; children: ReactNode }) {
  const value = useMemo(() => ({ offers, now, offset: 0 }), [offers, now]);
  return <OfferContext.Provider value={value}>{children}</OfferContext.Provider>;
}
export const useOffers = () => useContext(OfferContext);
export function useOfferFor(kind: PriceKind, slug: string) {
  const { offers, now } = useOffers();
  return winningOffer(offers, kind, slug, now);
}
export function useBarOffer() { const { offers, now } = useOffers(); return barOffer(offers, now); }
export function useFeaturedOffer() { const { offers, now } = useOffers(); return featuredOffer(offers, now); }
/** One-second clock for countdowns, starting from the shared offer clock so hydration matches. */
export function useTickingNow(enabled: boolean) {
  const { now, offset } = useOffers();
  const [tick, setTick] = useState(now);
  useEffect(() => {
    if (!enabled) return;
    setTick(Date.now() + offset);
    const timer = window.setInterval(() => setTick(Date.now() + offset), 1000);
    return () => window.clearInterval(timer);
  }, [enabled, offset]);
  return enabled ? Math.max(tick, now) : now;
}
