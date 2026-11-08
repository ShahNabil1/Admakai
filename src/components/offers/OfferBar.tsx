import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { X } from 'lucide-react';
import { useMotionPreference } from '@/hooks/use-motion-preference';
import { countdown, DISMISS_KEY, isOfferLive, offerEndLabel, pad2, parseDismissed, PRESETS, safeCtaLink, type PublicOffer } from '@/lib/offer-rules';
import { useBarOffer, useTickingNow } from './OfferContext';
import { offerStyle } from './OfferPrice';
import './offers.css';

// Runs while the page is still being parsed so an offer this visitor closed never flashes or pushes the header down.
const DISMISS_SCRIPT = `(function(){try{var ids=JSON.parse(localStorage.getItem('${DISMISS_KEY}')||'[]');if(!Array.isArray(ids))return;var css='';ids.forEach(function(id){if(typeof id==='string'&&/^[0-9a-f-]{36}$/i.test(id)){css+='.offer-bar-shell.offer-bar-shell[data-offer="'+id+'"]{display:none}:root:root:has(.offer-bar-shell[data-offer="'+id+'"]){--offer-bar-visible:0px}'}});if(css){var s=document.createElement('style');s.textContent=css;document.head.appendChild(s)}}catch(e){}})()`;

function Crescent() {
  return <svg className="offer-bar-crescent" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M15.5 3.2a8.8 8.8 0 1 0 5.3 15.2A7.4 7.4 0 0 1 15.5 3.2Z" fill="currentColor" /></svg>;
}

export function OfferCountdown({ offer, now, variant = 'bar' }: { offer: PublicOffer; now: number; variant?: 'bar' | 'banner' }) {
  const cd = offer.showCountdown ? countdown(offer.endsAt, now) : null;
  if (!cd) return null;
  const parts: [number, string][] = [[cd.days, 'd'], [cd.hours, 'h'], [cd.minutes, 'm'], [cd.seconds, 's']];
  return <div className={`offer-countdown is-${variant}`} role="timer" aria-label={offerEndLabel(offer.endsAt)}>
    <span className="offer-countdown-label" aria-hidden="true">Ends in</span>
    <span className="offer-countdown-boxes" aria-hidden="true">{parts.map(([value, unit]) => <span key={unit} className="offer-countdown-box">{pad2(value)}<i>{unit}</i></span>)}</span>
    <span className="offer-countdown-compact" aria-hidden="true">{cd.days > 0 ? `${cd.days}d ` : ''}{pad2(cd.hours)}:{pad2(cd.minutes)}:{pad2(cd.seconds)}</span>
  </div>;
}

/** The bar itself, used on the site and in the admin preview. */
export function OfferBarView({ offer, now, onClose, onCta }: { offer: PublicOffer; now: number; onClose?: () => void; onCta?: (event: MouseEvent<HTMLAnchorElement>) => void }) {
  const decor = PRESETS[offer.preset].decor;
  return <div className="offer-bar" style={offerStyle(offer)} role="region" aria-label="Current offer">
    <div className="offer-bar-inner">
      {decor === 'crescent' && <Crescent />}
      {decor === 'pulse' && <span className="offer-bar-pulse" aria-hidden="true" />}
      <p className="offer-bar-headline"><span key={`${offer.id}-${offer.headline}`} className="offer-bar-reveal">{offer.headline}</span></p>
      <div className="offer-bar-marquee" aria-hidden="true"><div className="offer-bar-track"><span>{offer.headline}</span><span>{offer.headline}</span></div></div>
      <OfferCountdown offer={offer} now={now} />
      <a className="offer-bar-cta" href={safeCtaLink(offer.ctaLink)} onClick={onCta}>{offer.ctaText}</a>
      {onClose && <button type="button" className="offer-bar-close" aria-label="Close offer" onClick={onClose}><X size={15} aria-hidden="true" /></button>}
    </div>
  </div>;
}

/** Slim offer bar above the public header. It scrolls away with the page and exposes its visible height to the header. */
export function OfferBar() {
  const offer = useBarOffer();
  const now = useTickingNow(Boolean(offer));
  const reduce = useMotionPreference();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [closing, setClosing] = useState(false);
  const firstId = useRef(offer?.id ?? null);
  const shell = useRef<HTMLDivElement>(null);
  useEffect(() => { try { setDismissed(parseDismissed(localStorage.getItem(DISMISS_KEY))); } catch { /* storage blocked */ } }, []);
  useEffect(() => { setClosing(false); }, [offer?.id]);
  const show = Boolean(offer && isOfferLive(offer, now) && !dismissed.includes(offer.id));

  useEffect(() => {
    const el = shell.current;
    const root = document.documentElement;
    if (!show || !el) return;
    let frame = 0;
    const update = () => { frame = 0; root.style.setProperty('--offer-bar-visible', `${Math.max(0, el.offsetHeight - Math.max(0, window.scrollY))}px`); };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    const observer = new ResizeObserver(schedule);
    observer.observe(el);
    window.addEventListener('scroll', schedule, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener('scroll', schedule); if (frame) window.cancelAnimationFrame(frame); root.style.removeProperty('--offer-bar-visible'); };
  }, [show, offer?.id]);

  if (!show || !offer) return null;
  const close = () => {
    const store = () => {
      try { localStorage.setItem(DISMISS_KEY, JSON.stringify([...parseDismissed(localStorage.getItem(DISMISS_KEY)).filter(id => id !== offer.id), offer.id])); } catch { /* storage blocked: hide for this visit */ }
      setDismissed(list => [...list, offer.id]);
    };
    if (reduce) { store(); return; }
    setClosing(true);
    window.setTimeout(store, 420);
  };
  const onCta = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    void navigate({ href: safeCtaLink(offer.ctaLink) });
  };
  return <div ref={shell} className={`offer-bar-shell${closing ? ' is-closing' : ''}${offer.id !== firstId.current ? ' is-entering' : ''}`} data-offer={offer.id} data-open="">
    <script dangerouslySetInnerHTML={{ __html: DISMISS_SCRIPT }} />
    <div className="offer-bar-clip"><OfferBarView offer={offer} now={now} onClose={close} onCta={onCta} /></div>
  </div>;
}
