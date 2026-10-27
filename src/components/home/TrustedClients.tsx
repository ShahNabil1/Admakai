import { animate, motion, useInView, type MotionStyle } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { AD_COUNT, BRAND_COUNT, clients, marqueeClients } from '@/data/clients';
import { Reveal } from '@/components/motion/Reveal';
import { useMotionPreference } from '@/hooks/use-motion-preference';
import './trusted-clients.css';

function Counter({ value, started }: { value: number; started: boolean }) {
  const reduce = useMotionPreference();
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (reduce || !started) return;
    const animation = animate(0, value, { duration: 1.2, ease: 'easeOut', onUpdate: (next) => setCurrent(Math.round(next)) });
    return () => animation.stop();
  }, [started, value, reduce]);
  return <span className="trusted-clients__number">{reduce ? value : current}</span>;
}

function LogoRow({ reverse = false, started }: { reverse?: boolean; started: boolean }) {
  const reduce = useMotionPreference();
  const [paused, setPaused] = useState(false);
  const items = reduce ? (reverse ? clients.slice(5) : clients.slice(0, 5)) : (reverse ? [...marqueeClients].reverse() : marqueeClients);
  const timing = {
    '--desktop-duration': `${marqueeClients.length * (180 + 56) / 40}s`,
    '--mobile-duration': `${marqueeClients.length * (140 + 36) / 30}s`,
  } as MotionStyle;
  return (
    <motion.div
      className={`client-marquee${reverse ? ' client-marquee--reverse' : ''}`}
      style={timing}
      data-paused={paused}
      aria-label={`${reverse ? 'Second' : 'First'} client logo row`}
      onPointerUp={(event) => { if (event.pointerType !== 'mouse') setPaused((previous) => !previous); }}
      tabIndex={reduce ? undefined : 0}
      onKeyDown={(event) => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); setPaused((previous) => !previous); } }}
      initial={{ opacity: 0, x: reverse ? -60 : 60 }}
      animate={reduce || started ? { opacity: 1, x: 0 } : { opacity: 0, x: reverse ? -60 : 60 }}
      transition={{ duration: reduce ? 0 : 0.8, delay: reduce ? 0 : reverse ? 0.2 : 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="client-marquee__track">
        {[false, true].map((duplicate) => (
          <div className="client-marquee__group" key={String(duplicate)} aria-hidden={duplicate || undefined}>
            {items.map((client, index) => (
              <div className="client-marquee__cell" key={`${client.name}-${index}`}>
                <img className={`client-marquee__logo${client.name === 'Jim & Jolly' ? ' client-marquee__logo--opaque' : ''}`} src={client.src} alt={duplicate ? '' : client.name} loading="lazy" decoding="async" draggable={false} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function TrustedClients() {
  const section = useRef<HTMLElement>(null);
  const started = useInView(section, { once: true, amount: 0.2 });
  return (
    <section className="trusted-clients" ref={section} aria-label="Trusted by">
      <div className="trusted-clients__heading container-site">
        <Reveal><p className="trusted-clients__eyebrow">Brands that stopped booking shoots</p></Reveal>
        <Reveal delay={0.1}>
          <p className="trusted-clients__summary"><Counter value={BRAND_COUNT} started={started} /> brands. <Counter value={AD_COUNT} started={started} /> ads. Zero shoots.</p>
        </Reveal>
      </div>
      <div className="trusted-clients__rows">
        <LogoRow started={started} />
        <div className="trusted-clients__divider"><span className="trusted-clients__pill">and counting</span></div>
        <LogoRow reverse started={started} />
      </div>
    </section>
  );
}