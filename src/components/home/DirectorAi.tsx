import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useMotionPreference } from '@/hooks/use-motion-preference';
import { Reveal } from '@/components/motion/Reveal';
import { SplitText } from '@/components/motion/SplitText';
import { gsap, registerGsap } from '@/lib/gsap';
import './director-ai.css';

const ease = [0.22, 1, 0.36, 1] as const;

export function DirectorAi() {
  const reduce = useMotionPreference();
  const section = useRef<HTMLElement>(null);
  const one = useRef<HTMLSpanElement>(null);
  const two = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduce || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    registerGsap();
    const ctx = gsap.context(() => {
      const st = { trigger: section.current, start: 'top bottom', end: 'bottom top', scrub: true };
      gsap.fromTo(one.current, { x: -20 }, { x: 20, ease: 'none', scrollTrigger: st });
      gsap.fromTo(two.current, { x: 20 }, { x: -20, ease: 'none', scrollTrigger: st });
    }, section);
    return () => ctx.revert();
  }, [reduce]);

  const view = { once: true, margin: '-80px' } as const;
  const col = (i: number) => reduce ? {} : {
    initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: view,
    transition: { delay: i * .15, duration: .7, ease },
  };

  return (
    <section className="director-ai" ref={section} aria-labelledby="director-ai-title">
      <Reveal className="director-ai__panel">
        <motion.div className="director-ai__eyebrow" initial={reduce ? false : "hidden"} whileInView="visible" viewport={view}>
          <motion.span className="director-ai__line" style={{ transformOrigin: 'left' }} variants={{ hidden: { scaleX: 0 }, visible: { scaleX: 1 } }} transition={{ duration: reduce ? 0 : .6, ease }} />
          <span className="director-ai__eyebrow-text">Director + AI</span>
        </motion.div>
        <h2 id="director-ai-title" className="director-ai__title">
          <span ref={one} className="director-ai__one"><SplitText text="We don't replace the director." /></span>
          <span ref={two} className="director-ai__two-wrap">
            <motion.span className="director-ai__two" initial={reduce ? false : { opacity: 0, x: 60 }} whileInView={{ opacity: 1, x: 0 }} viewport={view} transition={{ delay: reduce ? 0 : .3, duration: reduce ? 0 : .9, ease }}>We replace the shoot.</motion.span>
          </span>
        </h2>
        <div className="director-ai__cols">
          <motion.p {...col(0)} className="director-ai__lead">Real directors and editors, backed by AI models, on every single ad.</motion.p>
          <motion.div {...col(1)} className="director-ai__body">
            <p>Pure AI gets faces, hands and brand details wrong, and people can tell. A full shoot gets them right, but it costs a crew, a location and three weeks.</p>
            <p>At Admakai we run a hybrid pipeline. AI generates the footage, voices and variations. A human director writes the idea, locks the characters and signs off every frame. That is how our AI ads pass as human made.</p>
          </motion.div>
        </div>
      </Reveal>
      <p className="sr-only">Admakai makes humanized AI ads for brands in Bangladesh and abroad: AI commercials, product films and social content that look like a real shoot.</p>
    </section>
  );
}
