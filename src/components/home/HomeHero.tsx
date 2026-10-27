import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useMotionPreference } from '@/hooks/use-motion-preference';
import { ArrowUpRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Magnetic } from '@/components/motion/Magnetic';
import { SplitText } from '@/components/motion/SplitText';
import { Button } from '@/components/ui/button';
import { gsap, registerGsap } from '@/lib/gsap';
import './hero.css';

const ease = [0.22, 1, 0.36, 1] as const;

export function HomeHero() {
  const reduce = useMotionPreference();
  const hero = useRef<HTMLElement>(null);
  const image = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    registerGsap();
    const ctx = gsap.context(() => {
      gsap.to(image.current, {
        y: () => (hero.current?.offsetHeight ?? 0) * 0.85,
        ease: 'none',
        scrollTrigger: { trigger: hero.current, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
      });
      gsap.to(content.current, {
        y: -70, opacity: 0, ease: 'none',
        scrollTrigger: { trigger: hero.current, start: 'top top', end: 'bottom top', scrub: true },
      });
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
        <div className="hero-parallax" ref={image}>
          <motion.div className="hero-image-reveal" initial={reduce ? false : { scale: 1.08, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: reduce ? 0 : 1.4, ease }}>
            <motion.img className="hero-image" src="/hero/hero.jpg" alt="A golden chair reflected in a still lake beneath a sunset sky" fetchPriority="high" initial={false} animate={reduce ? { scale: 1 } : { scale: [1, 1.06] }} transition={reduce ? { duration: 0 } : { delay: 1.4, duration: 18, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }} />
          </motion.div>
        </div>
        <div className="hero-shade" />
        <svg className="hero-grain" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
          <filter id="hero-noise"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" stitchTiles="stitch" /></filter>
          <rect width="100%" height="100%" filter="url(#hero-noise)" />
        </svg>
        <Navbar hero />
        <div className="hero-content" ref={content}>
          <motion.div className="hero-play" initial={reduce ? false : { opacity: 0, scale: .6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: reduce ? 0 : .5, duration: reduce ? 0 : .5, ease }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10" cy="10" r="8" /><path d="m8 6.5 5 3.5-5 3.5z" strokeLinejoin="round" /></svg>
          </motion.div>
          <h1 id="hero-title" className="hero-headline">
            <span className="hero-headline-line"><SplitText text="Your next ad" delay={.6} stagger={.05} /></span>
            <span className="hero-headline-line"><SplitText text="doesn't need a shoot." delay={.75} stagger={.05} /></span>
          </h1>
          <motion.p {...rise(1)} className="hero-sub">Admakai makes commercials, product films and social content with AI. Brief us on a call, send one photo, and see the first cut in five days.</motion.p>
          <motion.div {...rise(1.15)} className="hero-actions">
            <Magnetic><Button asChild className="hero-call hero-main-call"><Link to="/book-a-call">Book a call</Link></Button></Magnetic>
            <Link className="hero-work-link" to="/work">See the work <ArrowUpRight size={14} aria-hidden="true" /></Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}