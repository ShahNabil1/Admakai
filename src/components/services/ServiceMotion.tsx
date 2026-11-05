import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useMotionPreference } from '@/hooks/use-motion-preference';

export function ServiceReveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useMotionPreference();
  return <motion.div className={className} initial={{ opacity: 0, y: reduce ? 0 : 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: reduce ? 0.2 : 0.7, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}

export function ServiceHeadline({ lines, className }: { lines: string[]; className?: string }) {
  const reduce = useMotionPreference();
  return <span className={className}>
    <span className="sr-only">{lines.join(' ')}</span>
    {lines.map((line, index) => <span aria-hidden="true" key={`${index}-${line}`} className="block overflow-hidden"><motion.span className="block" initial={{ opacity: 0, y: reduce ? '0%' : '110%' }} whileInView={{ opacity: 1, y: '0%' }} viewport={{ once: true }} transition={{ duration: reduce ? 0.2 : 0.7, delay: reduce ? 0 : index * 0.08, ease: [0.22, 1, 0.36, 1] }}>{line}</motion.span></span>)}
  </span>;
}
