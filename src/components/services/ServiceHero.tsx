import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ChevronDown, Clock, Play, Tag, X } from 'lucide-react';
import { serviceCategories, servicePriceLine, type HeroMedia, type Service } from '@/data/services';
import { resolveHeroMedia } from '@/data/heroMediaDefaults';
import { useMotionPreference } from '@/hooks/use-motion-preference';
import './service-hero.css';

type Slot = HeroMedia | null;

function MediaSlot({ media, aspect, active, inView, reduce, onOpen, onEnded, label, className = '' }: {
  media: Slot; aspect: HeroMedia['aspect']; active: boolean; inView: boolean; reduce: boolean;
  onOpen?: (m: HeroMedia) => void; onEnded?: () => void; label?: string; className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current; if (!v) return;
    if (inView && active && !reduce) v.play().catch(() => {}); else v.pause();
  }, [inView, active, reduce]);
  const ratio = aspect.replace(':', ' / ');
  const pill = media?.label ?? label;
  return <button type="button" className={`service-hero-slot ${className}`} style={{ aspectRatio: ratio }}
    onClick={() => media && onOpen?.(media)} aria-label={media ? `Play ${pill ?? 'sample'} video` : 'Sample video coming soon'} disabled={!media}>
    {media ? <video ref={ref} muted loop={!onEnded} playsInline preload="metadata" poster={media.poster} onEnded={onEnded}>
      {inView && <source src={media.src} type="video/mp4"/>}
    </video> : <span className="service-hero-placeholder"><span className="service-hero-play"><Play size={16}/></span></span>}
    {(pill || !media) && <span className="service-hero-pill">{media ? pill : 'Sample'}</span>}
  </button>;
}

export function ServiceHero({ service }: { service: Service }) {
  const reduce = useMotionPreference();
  const navigate = useNavigate();
  const category = serviceCategories.find(c => c.id === service.category);
  const media = resolveHeroMedia(service);
  const reels: Slot[] = media.reels.length ? media.reels : [null, null];
  const sides: [Slot, Slot, Slot, Slot] = [media.sides[0] ?? null, media.sides[1] ?? null, media.sides[2] ?? null, media.sides[3] ?? null];
  const [index, setIndex] = useState(0);
  const [inView, setInView] = useState(false);
  const [open, setOpen] = useState<HeroMedia | null>(null);
  const [contact, setContact] = useState('');
  const root = useRef<HTMLElement>(null);
  const touch = useRef<number | null>(null);

  useEffect(() => {
    const el = root.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 });
    io.observe(el); return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (reduce || !inView || reels.length < 2) return;
    const t = window.setTimeout(() => setIndex(i => (i + 1) % reels.length), 6000);
    return () => window.clearTimeout(t);
  }, [index, reduce, inView, reels.length]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const step = (d: number) => setIndex(i => (i + d + reels.length) % reels.length);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: '/book', search: { service: service.slug, contact: contact.trim() } as never });
  };
  const scrollNext = () => root.current?.nextElementSibling?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  const formats = (service.formats.match(/\d+:\d+/g) ?? []);
  const badges = [...new Set([...formats, '1080p', '9:16', '16:9', '1:1'])].slice(0, 4);
  const { lead, accent, rest } = service.heroTitle;
  const tight = /^[.,!?]/.test(rest);
  const shared = { inView, reduce, onOpen: setOpen };

  return <header ref={root} className="service-hero" aria-labelledby="service-hero-title">
    <nav className="service-hero-crumbs" aria-label="Breadcrumb">
      <Link to="/services">Services</Link><span aria-hidden="true">/</span><span>{category?.name}</span>
      {service.isNew && <span className="service-hero-new">New</span>}
    </nav>
    <h1 id="service-hero-title" className="service-hero-title">
      {lead} <em>{accent}</em>{rest && (tight ? rest : ` ${rest}`)}
    </h1>
    <p className="service-hero-sub">{service.description}</p>
    <form className="service-hero-field" onSubmit={submit}>
      <label htmlFor="service-hero-contact" className="sr-only">Your email or WhatsApp number</label>
      <input id="service-hero-contact" value={contact} onChange={e => setContact(e.target.value)} placeholder="Your email or WhatsApp number" autoComplete="email"/>
      <button type="submit">Get my quote →</button>
    </form>
    <p className="service-hero-trust">
      <span><Tag size={13} aria-hidden="true"/>{/^get/i.test(servicePriceLine(service)) ? 'Price on quote' : `Estimated ${servicePriceLine(service)}`}</span>
      <span aria-hidden="true">•</span>
      <span><Clock size={13} aria-hidden="true"/>Delivery in {service.delivery}</span>
    </p>

    <div className="service-hero-show">
      {badges.map((b, i) => <span key={b} className={`service-hero-badge service-hero-badge-${i}`} aria-hidden="true">{b}</span>)}
      <div className="service-hero-side service-hero-left">
        <MediaSlot {...shared} className="service-hero-outer" media={sides[2]} aspect={sides[2]?.aspect ?? '9:16'} active/>
        <MediaSlot {...shared} className="service-hero-inner" media={sides[0]} aspect={sides[0]?.aspect ?? '16:9'} active/>
      </div>
      <div className="service-hero-phone-wrap">
        <div className="service-hero-phone"
          onTouchStart={e => { touch.current = e.touches[0]?.clientX ?? null; }}
          onTouchEnd={e => { if (touch.current === null) return; const dx = (e.changedTouches[0]?.clientX ?? touch.current) - touch.current; touch.current = null; if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1); }}>
          <div className="service-hero-status" aria-hidden="true"><span>9:41</span><span className="service-hero-signal"><i/><i/><i/><i/></span></div>
          <div className="service-hero-tabs" aria-hidden="true"><span className="is-active">Reel</span><span>{formats[0] ?? '9:16'}</span></div>
          <div className="service-hero-screen">
            {reels.map((r, i) => <div key={i} className={`service-hero-reel ${i === index ? 'is-on' : ''}`} aria-hidden={i !== index}>
              <MediaSlot {...shared} media={r} aspect="9:16" active={i === index} onEnded={() => step(1)}/>
            </div>)}
          </div>
        </div>
        <div className="service-hero-dots">{reels.map((_, i) => <button key={i} type="button" aria-label={`Show reel ${i + 1}`} aria-current={i === index} className={i === index ? 'is-on' : ''} onClick={() => setIndex(i)}/>)}</div>
      </div>
      <div className="service-hero-side service-hero-right">
        <MediaSlot {...shared} className="service-hero-inner" media={sides[1]} aspect={sides[1]?.aspect ?? '16:9'} active/>
        <MediaSlot {...shared} className="service-hero-outer" media={sides[3]} aspect={sides[3]?.aspect ?? '9:16'} active/>
      </div>
    </div>
    <div className="service-hero-rule"><button type="button" onClick={scrollNext} aria-label="Scroll to the next section"><ChevronDown size={14}/></button></div>

    {open && <div className="service-hero-lightbox" role="dialog" aria-modal="true" aria-label="Video player" onClick={() => setOpen(null)}>
      <button type="button" className="service-hero-close" onClick={() => setOpen(null)} aria-label="Close video"><X size={20}/></button>
      <video src={open.src} poster={open.poster} controls autoPlay playsInline onClick={e => e.stopPropagation()}/>
    </div>}
  </header>;
}
