import { useRef, type PointerEvent } from 'react';
import { Link } from '@tanstack/react-router';
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowUpRight, Mountain, Sparkles, Waves } from 'lucide-react';
import { useMotionPreference } from '@/hooks/use-motion-preference';

const VIDEO = 'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/deepdive3ddwArea.mp4';
const spring = { type: 'spring' as const, damping: 20, stiffness: 180 };

const cards = [
  { icon: Mountain, title: 'Worlds, not sets', text: 'Whole environments built in AI, lit and framed like a real location.' },
  { icon: Waves, title: 'Motion that breathes', text: 'Camera moves and ambient life that feel shot, not generated.' },
  { icon: Sparkles, title: 'Finished by people', text: 'Every frame graded and checked by a director before it ships.' },
];

function TiltCard({ card, reduce }: { card: (typeof cards)[number]; reduce: boolean }) {
  const rx = useSpring(useMotionValue(0), spring);
  const ry = useSpring(useMotionValue(0), spring);
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 10);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 10);
  };
  const Icon = card.icon;
  return (
    <motion.div
      onPointerMove={move}
      onPointerLeave={() => { rx.set(0); ry.set(0); }}
      whileHover={reduce ? undefined : { scale: 1.02 }}
      transition={spring}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 800, willChange: 'transform' }}
      className="rounded-[20px] border border-foreground/10 bg-background/55 p-6 backdrop-blur-md"
    >
      <Icon className="size-5 text-foreground" aria-hidden />
      <h3 className="mt-4 text-lg font-semibold text-foreground">{card.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-foreground/70">{card.text}</p>
    </motion.div>
  );
}

export function MossValley() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useMotionPreference();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const float = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [60, -60]);
  const item = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: spring },
  };

  return (
    <section ref={ref} aria-labelledby="moss-title" className="relative isolate min-h-dvh overflow-hidden bg-background">
      <video
        className="absolute inset-0 -z-10 size-full object-cover"
        src={VIDEO} muted playsInline autoPlay loop preload="metadata" aria-hidden
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/40 to-background/20" />

      <div className="mx-auto grid min-h-dvh max-w-[1280px] content-end gap-10 px-6 py-24 md:px-12 lg:grid-cols-12 lg:items-end">
        <motion.div
          className="lg:col-span-7"
          initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }}
          variants={{ show: { transition: { staggerChildren: 0.12 } } }}
        >
          <motion.span variants={item} className="inline-flex min-h-[32px] items-center rounded-full border border-foreground/20 bg-background/40 px-4 text-xs uppercase tracking-[0.2em] text-foreground backdrop-blur-sm">
            Moss Valley
          </motion.span>
          <motion.h2 id="moss-title" variants={item} className="mt-6 text-[clamp(2.4rem,6vw,5rem)] font-semibold leading-[0.95] tracking-tight text-foreground">
            Places that never existed, <span className="font-display font-normal italic">filmed anyway.</span>
          </motion.h2>
          <motion.p variants={item} className="mt-6 max-w-xl text-base leading-relaxed text-foreground/75 md:text-lg">
            We build full 3D worlds for your brand and move the camera through them, so the location fits the story instead of the budget.
          </motion.p>
          <motion.div variants={item} className="mt-8 flex flex-wrap gap-3">
            <Link to="/book-a-call" className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">
              Book a call <ArrowUpRight className="size-4" aria-hidden />
            </Link>
            <Link to="/work" className="inline-flex min-h-[48px] items-center rounded-full border border-foreground/30 px-6 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">
              See the work
            </Link>
          </motion.div>
        </motion.div>

        <motion.div style={{ y: float, willChange: 'transform' }} className="grid gap-4 md:grid-cols-3 lg:col-span-5 lg:grid-cols-1">
          {cards.map((c) => <TiltCard key={c.title} card={c} reduce={reduce} />)}
        </motion.div>
      </div>
    </section>
  );
}
