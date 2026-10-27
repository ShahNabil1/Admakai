import { motion } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import type { PointerEvent } from 'react';
import { useMotionPreference } from '@/hooks/use-motion-preference';
import { Reveal } from '@/components/motion/Reveal';
import { Magnetic } from '@/components/motion/Magnetic';
import './tool-stack.css';

const ease = [0.22, 1, 0.36, 1] as const;

const cards = [
  { label: 'Video', text: 'Text and image to video, character locked shots, camera moves.', tools: ['Seedance', 'Veo', 'Kling'] },
  { label: 'Image', text: 'Product shots, brand models, locations, upscaling.', tools: ['Midjourney', 'Nano Banana', 'Flux'] },
  { label: 'Voice and sound', text: 'Cloned and original voices, dubbing, music, sound design.', tools: ['ElevenLabs', 'Suno'] },
  { label: 'Direction and edit', text: 'Scripts, prompts, cut, grade, captions, delivery.', tools: ['Claude', 'DaVinci Resolve', 'After Effects'] },
];

function track(e: PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
}

export function ToolStack() {
  const reduce = useMotionPreference();
  const view = { once: true, margin: '-80px' } as const;
  return (
    <section className="tool-stack" aria-labelledby="tool-stack-title">
      <div className="tool-stack__inner">
        <Reveal>
          <h2 id="tool-stack-title" className="tool-stack__title">Human taste. AI speed.</h2>
          <p className="tool-stack__sub">The stack behind every Admakai ad, and who holds the wheel at each step.</p>
        </Reveal>
        <div className="tool-stack__grid">
          {cards.map((c, i) => (
            <motion.article
              key={c.label}
              className="tool-card"
              onPointerMove={track}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={view}
              transition={{ delay: reduce ? 0 : i * 0.1, duration: reduce ? 0 : 0.7, ease }}
            >
              <p className="tool-card__label">{c.label}</p>
              <p className="tool-card__text">{c.text}</p>
              <ul className="tool-card__badges">
                {c.tools.map((t, j) => (
                  <motion.li
                    key={t}
                    className="tool-card__badge"
                    initial={reduce ? false : { opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={view}
                    transition={{ delay: reduce ? 0 : i * 0.1 + 0.7 + j * 0.05, duration: reduce ? 0 : 0.35, ease }}
                  >{t}</motion.li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
        <div className="tool-stack__cta">
          <Magnetic><Link to="/book-a-call" className="tool-stack__button">Get started</Link></Magnetic>
        </div>
      </div>
    </section>
  );
}
