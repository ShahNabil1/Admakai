import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { animate, motion, useInView } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/motion/Magnetic";
import { Reveal } from "@/components/motion/Reveal";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { contentPartner, pricingInclusions } from "@/data/pricing";
import { useCurrency } from "@/lib/currency";
import { discountedRange, formatAmountRange } from "@/lib/offer-rules";
import { OfferPill, useOfferPrice } from "@/components/offers/OfferPrice";
import "./pricing.css";

function MonthlyPrice({ discountPercent = 0 }: { discountPercent?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: true });
  const reduce = useMotionPreference();
  const { formatRange, currency, rate } = useCurrency();
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!visible || reduce) return;
    const control = animate(0, 1, { duration: 1.2, onUpdate: setProgress });
    return () => control.stop();
  }, [visible, reduce]);
  const fraction = reduce ? 1 : progress;
  const partner = contentPartner();
  const range = discountPercent > 0
    ? (() => { const d = discountedRange(partner.priceMinUsd, partner.priceMaxUsd, discountPercent, currency, rate); return formatAmountRange({ min: Math.round(d.min * fraction), max: Math.round(d.max * fraction) }, currency); })()
    : formatRange(partner.priceMinUsd * fraction, partner.priceMaxUsd * fraction);
  return <span ref={ref}>{range.split(' to ').map((amount, i) => <Fragment key={i}>{i > 0 ? ' to ' : null}<span className="inline-block">{amount}</span></Fragment>)}</span>;
}

export function Pricing() {
  const reduce = useMotionPreference();
  const partner = contentPartner();
  const offer = useOfferPrice("plan", partner.slug, partner.priceMinUsd, partner.priceMaxUsd);
  return (
    <section className="home-pricing" aria-labelledby="home-pricing-title">
      <div className="container-site">
        <Reveal><p className="home-pricing-eyebrow">One plan, every format</p><h2 id="home-pricing-title">Admakai Content Partner</h2></Reveal>
        <motion.article className="home-pricing-card" initial={reduce ? false : "hidden"} animate={reduce ? "visible" : false} whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={{ hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: reduce ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <div>
            <h3 className="home-pricing-name">{partner.name}</h3>
            {offer.offer && <p className="offer-plan home-pricing-offer"><OfferPill offer={offer.offer} /><s className="offer-was"><span className="sr-only">Was </span>{offer.original}/month</s></p>}
            <p className="home-pricing-price"><strong><MonthlyPrice discountPercent={offer.offer?.discountPercent ?? 0} /></strong><small>/month</small></p>
            {offer.offer && <p className="offer-plan home-pricing-offer"><span className="offer-save">You save {offer.savings} a month</span><span className="offer-ends">{offer.ends}</span></p>}
            <p className="home-pricing-copy">{partner.videos} videos and {partner.statics} statics every month, any mix of the services below. Pause or cancel any month.</p>
            <div className="home-pricing-actions">
              <Magnetic><Button asChild className="home-pricing-start"><Link to="/book" search={{plan: partner.id}}>Get started</Link></Button></Magnetic>
              <Button asChild variant="link" className="home-pricing-all"><Link to="/pricing">See all plans</Link></Button>
            </div>
            <p className="home-pricing-guarantee"><ShieldCheck aria-hidden="true" />First cut in {partner.firstCutDays} days or the month is free</p>
          </div>
          <div><p className="home-pricing-label">Included</p>
            <ul className="home-pricing-included">
              {pricingInclusions().map((item, index) => <motion.li key={item} variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }} transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : index * 0.05 }}>
                <svg className="home-pricing-check" viewBox="0 0 18 18" aria-hidden="true"><motion.circle cx="9" cy="9" r="8" variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }} transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : index * 0.05 }} /><path d="m5.5 9 2.2 2.2 4.8-4.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span>{item}</span>
              </motion.li>)}
            </ul>
          </div>
        </motion.article>
        <p className="home-pricing-foot">Need one project, not a plan? Every service is also priced per project. <Link to="/pricing">Pricing page</Link></p>
      </div>
    </section>
  );
}