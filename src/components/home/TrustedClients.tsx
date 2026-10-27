import { animate, motion, useInView, type MotionStyle } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { AD_COUNT, BRAND_COUNT, clients, marqueeClients } from '@/data/clients';
import { Reveal } from '@/components/motion/Reveal';
import { useMotionPreference } from '@/hooks/use-motion-preference';
import { useTimedLogo } from '@/hooks/use-timed-logo';
import { Button } from '@/components/ui/button';
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
  const { active, activate } = useTimedLogo();
  const items = reduce ? (reverse ? clients.slice(5) : clients.slice(0, 5)) : (reverse ? [...marqueeClients].reverse() : marqueeClients);
  const timing = {
    '--desktop-duration': `${marqueeClients.length * (160 + 20) / 40}s`,
    '--mobile-duration': `${marqueeClients.length * (130 + 16) / 40}s`,
  } as MotionStyle;
  return (
    <motion.div
      className={`client-marquee${reverse ? ' client-marquee--reverse' : ''}`}
      style={timing}
      aria-label={`${reverse ? 'Second' : 'First'} client logo row`}
      initial={{ opacity: 0 }}
      animate={{ opacity: reduce || started ? 1 : 0 }}
      transition={{ duration: reduce ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="client-marquee__track">
        {[false, true].map((duplicate) => (
          <div className="client-marquee__group" key={String(duplicate)} aria-hidden={duplicate || undefined}>
            {items.map((client, index) => (
              <Button variant="ghost" className="client-marquee__cell" key={`${client.name}-${index}`} aria-label={client.name} tabIndex={duplicate ? -1 : 0} data-active={active === client.name} onPointerUp={(event) => { if (event.pointerType !== 'mouse') activate(client.name); }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') activate(client.name); }}>
                <img className="client-marquee__logo" src={client.src} alt={duplicate ? '' : client.name} decoding="async" draggable={false} />
              </Button>
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
        <LogoRow reverse started={started} />
      </div>
    </section>
  );
}