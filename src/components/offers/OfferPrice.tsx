import type { CSSProperties, ReactNode } from 'react';
import type { CurrencyCode } from '@/data/fallbackRates';
import { useCurrency } from '@/lib/currency';
import { convertRange, formatCurrencyRange } from '@/lib/currency-rules';
import { discountedRange, formatAmountRange, offerEndLabel, readableOn, savingsRange, winningOffer, type PriceKind, type PublicOffer } from '@/lib/offer-rules';
import { useOfferFor, useOffers } from './OfferContext';
import './offers.css';

export type OfferPriceInfo = { offer: PublicOffer | null; original: string; current: string; savings: string; ends: string };
/** Pure: the price a visitor sees, with the winning offer applied on top of the stored base price. */
export function offerPriceInfo(offer: PublicOffer | null, minUsd: number, maxUsd: number, currency: CurrencyCode, rate: number): OfferPriceInfo {
  const original = formatCurrencyRange(minUsd, maxUsd, currency, rate);
  if (!offer) return { offer: null, original, current: original, savings: '', ends: '' };
  const discounted = discountedRange(minUsd, maxUsd, offer.discountPercent, currency, rate);
  return {
    offer, original, current: formatAmountRange(discounted, currency),
    savings: formatAmountRange(savingsRange(convertRange(minUsd, maxUsd, currency, rate), discounted), currency),
    ends: offerEndLabel(offer.endsAt),
  };
}
export function useOfferPrice(kind: PriceKind, slug: string, minUsd: number, maxUsd: number) {
  const offer = useOfferFor(kind, slug);
  const { currency, rate } = useCurrency();
  return offerPriceInfo(offer, minUsd, maxUsd, currency, rate);
}
/** For places that build price text in a loop or need a plain string (tooltips). */
export function useOfferPriceText() {
  const { offers, now } = useOffers();
  const { currency, rate } = useCurrency();
  return (kind: PriceKind, slug: string, minUsd: number, maxUsd: number) => {
    const info = offerPriceInfo(winningOffer(offers, kind, slug, now), minUsd, maxUsd, currency, rate);
    return info.offer ? `${info.current} (${info.offer.shortBadge}, was ${info.original})` : info.original;
  };
}

export function offerStyle(offer: PublicOffer): CSSProperties {
  return {
    '--offer-bg': offer.theme.background, '--offer-fg': offer.theme.text, '--offer-accent': offer.theme.accent,
    '--offer-accent-fg': readableOn(offer.theme.accent), '--offer-badge': offer.theme.badge, '--offer-badge-fg': readableOn(offer.theme.badge),
  } as CSSProperties;
}
export function OfferPill({ offer, className = '' }: { offer: PublicOffer; className?: string }) {
  return <span className={`offer-pill ${className}`} style={offerStyle(offer)}>{offer.shortBadge}</span>;
}

/**
 * A price range with the live offer applied: badge pill, struck original, large new price and end date.
 * Without an offer it renders exactly the plain text it replaces.
 */
export function OfferRange({ kind, slug, minUsd, maxUsd, prefix = '', suffix = '', compact = false }: { kind: PriceKind; slug: string; minUsd: number; maxUsd: number; prefix?: ReactNode; suffix?: ReactNode; compact?: boolean }) {
  const p = useOfferPrice(kind, slug, minUsd, maxUsd);
  if (!p.offer) return <>{prefix}{p.original}{suffix}</>;
  return <span className={`offer-price${compact ? ' is-compact' : ''}`}>
    <OfferPill offer={p.offer} />
    <span className="offer-price-line">
      {prefix}<s className="offer-was"><span className="sr-only">Was </span>{p.original}</s>{' '}
      <strong className="offer-now"><span className="sr-only">Now </span>{p.current}</strong>{suffix}
    </span>
    <span className="offer-ends">{p.ends}</span>
  </span>;
}

/** Monthly plan price block: pill, struck original, big new price, savings and end date. */
export function PlanOfferPrice({ slug, minUsd, maxUsd, priceClassName = 'plan-price', perLabel = '/month' }: { slug: string; minUsd: number; maxUsd: number; priceClassName?: string; perLabel?: string }) {
  const p = useOfferPrice('plan', slug, minUsd, maxUsd);
  if (!p.offer) return <div className={priceClassName}>{p.original}<small>{perLabel}</small></div>;
  return <div className="offer-plan">
    <OfferPill offer={p.offer} />
    <s className="offer-was"><span className="sr-only">Was </span>{p.original}{perLabel}</s>
    <div className={priceClassName}><span className="sr-only">Now </span>{p.current}<small>{perLabel}</small></div>
    <p className="offer-save">You save {p.savings} a month</p>
    <p className="offer-ends">{p.ends}</p>
  </div>;
}
