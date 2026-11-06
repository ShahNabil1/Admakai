import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useMotionPreference } from '@/hooks/use-motion-preference';

export function ServiceLandingReveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useMotionPreference();
  return <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .1 }} transition={{ duration: reduce ? 0 : .6, delay: reduce ? 0 : delay, ease: [.22, 1, .36, 1] }}>{children}</motion.div>;
}