import { motion } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import { useEffect, useRef, type PointerEvent } from 'react';
import { useMotionPreference } from '@/hooks/use-motion-preference';
import { Reveal } from '@/components/motion/Reveal';
import { capabilities, type Capability } from '@/data/capabilities';
import './capabilities.css';

const ease = [0.22, 1, 0.36, 1] as const;

function track(e: PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--cx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--cy', `${e.clientY - r.top}px`);
}

function CapCard({ c, i, reduce }: { c: Capability; i: number; reduce: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    }, { threshold: 0.25 });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 40, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay: reduce ? 0 : (i % 4) * 0.08, duration: reduce ? 0 : 0.8, ease }}
    >
      <Link to="/services" hash={c.slug} className="cap-card" onPointerMove={track}>
        <div className="cap-card__media">
          <video ref={ref} src={c.video} poster={c.poster} muted loop playsInline preload="metadata" aria-label={c.label} />
        </div>
        <div className="cap-card__body">
          <h3 className="cap-card__title">{c.title}</h3>
          <p className="cap-card__copy">{c.copy}</p>
        </div>
        <span className="cap-card__cursor" aria-hidden="true">View</span>
      </Link>
    </motion.div>
  );
}

export function Capabilities() {
  const reduce = useMotionPreference();
  return (
    <section className="caps" aria-labelledby="caps-title">
      <div className="caps__inner">
        <Reveal>
          <div className="caps__eyebrow"><span className="caps__line" />What AI does here</div>
          <h2 id="caps-title" className="caps__title">AI is not an add-on. It is the production line.</h2>
          <p className="caps__sub">Every capability below ships inside a human-led process: a director writes, AI produces, an editor finishes.</p>
        </Reveal>
        <div className="caps__grid">
          {capabilities.map((c, i) => <CapCard key={c.slug} c={c} i={i} reduce={reduce} />)}
        </div>
      </div>
    </section>
  );
}
