import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useMotionPreference } from '@/hooks/use-motion-preference';
import { useEffect, useRef, useState } from 'react';
import { Magnetic } from '@/components/motion/Magnetic';
import { SplitText } from '@/components/motion/SplitText';
import { Button } from '@/components/ui/button';
import { gsap, registerGsap } from '@/lib/gsap';
import './hero.css';

const ease = [0.22, 1, 0.36, 1] as const;

export function HomeHero() {
  const reduce = useMotionPreference();
  const hero = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const pick = () => setSrc(mq.matches ? '/hero/hero-mobile.mp4' : '/hero/hero.mp4');
    pick();
    mq.addEventListener('change', pick);
    return () => mq.removeEventListener('change', pick);
  }, []);

  useEffect(() => {
    if (reduce || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    registerGsap();
    const ctx = gsap.context(() => {
      const st = { trigger: hero.current, start: 'top top', end: 'bottom 80px', scrub: true, invalidateOnRefresh: true };
      gsap.to(video.current, { scale: 1.08, ease: 'none', scrollTrigger: st });
      gsap.to(content.current, { y: () => -((hero.current?.offsetHeight ?? 0) * 0.3), opacity: 0, ease: 'none', scrollTrigger: st });
    }, hero);
    return () => ctx.revert();
  }, [reduce]);

  const rise = (delay: number) => ({
    initial: reduce ? false as const : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: reduce ? 0 : delay, duration: reduce ? 0 : 0.7, ease },
  });

  return (
    <div className="home-page">
      <section className="home-hero" ref={hero} aria-labelledby="hero-title">
        <motion.div className="hero-media" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduce ? 0 : 1 }}>
          <video ref={video} className="hero-video" key={src ?? 'poster'} autoPlay muted loop playsInline poster="/hero/hero-poster.jpg" aria-hidden="true">
            {src && <source src={src} type="video/mp4" />}
          </video>
        </motion.div>
        <div className="hero-shade" />
        <div className="hero-content" ref={content}>
          <div className="hero-tagline">
            <motion.span className="hero-tagline-line" initial={reduce ? false : { width: 0 }} animate={{ width: 56 }} transition={{ delay: reduce ? 0 : .3, duration: reduce ? 0 : .6, ease }} />
            <span className="hero-tagline-text">AI ads that don't look like AI.</span>
          </div>
          <h1 id="hero-title" className="hero-headline">
            <span className="hero-headline-line"><SplitText text="Best AI Ad Agency for" delay={.5} stagger={.05} /></span>
            <span className="hero-headline-line"><SplitText text="Commercials, Product Films" delay={.7} stagger={.05} /></span>
            <span className="hero-headline-line"><SplitText text="and Social Content" delay={.9} stagger={.05} /></span>
          </h1>
          <motion.p {...rise(1)} className="hero-sub">Admakai combines real directors and editors with generative video, image and voice models. You get human-level ads, finished in days, without a shoot.</motion.p>
        </div>
        <motion.div {...rise(1.2)} className="hero-bottom">
          <Magnetic><Button asChild className="hero-main-call"><Link to="/book-a-call">Book a call</Link></Button></Magnetic>
          <p className="hero-note">Ship <span>3x</span> more ads<br />without booking a single shoot.</p>
        </motion.div>
      </section>
    </div>
  );
}
