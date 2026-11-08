import { Link } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { isOfferLive, offerEndLabel } from '@/lib/offer-rules';
import { useFeaturedOffer, useTickingNow } from './OfferContext';
import { OfferCountdown } from './OfferBar';
import { offerStyle } from './OfferPrice';
import './offers.css';

/** Wide themed card at the top of /pricing; renders nothing when no offer is live. */
export function PricingOfferBanner() {
  const offer = useFeaturedOffer();
  const now = useTickingNow(Boolean(offer));
  if (!offer || !isOfferLive(offer, now)) return null;
  return <Reveal><section className="offer-banner" style={offerStyle(offer)} aria-label="Current offer">
    <span className="offer-banner-shape is-one" aria-hidden="true" /><span className="offer-banner-shape is-two" aria-hidden="true" />
    <div className="offer-banner-copy">
      <span className="offer-pill">{offer.shortBadge}</span>
      <h2>{offer.headline}</h2>
      <OfferCountdown offer={offer} now={now} variant="banner" />
      {!(offer.showCountdown && offer.endsAt) && <p className="offer-banner-ends">{offerEndLabel(offer.endsAt)}</p>}
      <Link to="/book" className="offer-banner-cta">Book a call <ArrowUpRight size={16} aria-hidden="true" /></Link>
    </div>
    <p className="offer-banner-pct"><strong>{offer.discountPercent}%</strong><span>OFF</span></p>
  </section></Reveal>;
}
