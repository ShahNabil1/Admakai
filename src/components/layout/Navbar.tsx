import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useMotionPreference } from '@/hooks/use-motion-preference';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const links = [
  { label: 'Work', to: '/work' },
  { label: 'Services', to: '/services' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'About', to: '/about' },
] as const;

export function Navbar({ hero = false }: { hero?: boolean }) {
  const [open, setOpen] = useState(false);
  const reduce = useMotionPreference();
  if (!hero) return <nav>Navbar</nav>;

  return (
    <>
      <motion.nav className="hero-navbar" aria-label="Main navigation" initial={reduce ? false : { opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : .3, duration: reduce ? 0 : .6 }}>
        <Link to="/" aria-label="Admakai home"><img className="hero-logo" src="/brand/logo-white.png" alt="Admakai" /></Link>
        <div className="hero-nav-links">
          {links.map(link => <Link key={link.to} to={link.to} className="hero-nav-link">{link.label}</Link>)}
          <Button asChild className="hero-call hero-nav-call"><Link to="/book-a-call">Book a call</Link></Button>
        </div>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild><Button variant="ghost" size="icon" className="hero-menu-trigger" aria-label="Open menu"><span className="hero-menu-icon" aria-hidden="true"><span /><span /></span></Button></Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Content className="hero-mobile-menu" aria-describedby={undefined}>
              <Dialog.Title className="sr-only">Navigation</Dialog.Title>
              <Link to="/" onClick={() => setOpen(false)} aria-label="Admakai home"><img className="hero-logo" src="/brand/logo-white.png" alt="Admakai" /></Link>
              <Dialog.Close asChild><Button variant="ghost" size="icon" className="hero-menu-close" aria-label="Close menu"><X /></Button></Dialog.Close>
              <motion.nav className="hero-menu-items" aria-label="Mobile navigation" initial="hidden" animate="visible" transition={{ staggerChildren: reduce ? 0 : .05 }}>
                {[...links, { label: 'Book a call', to: '/book-a-call' } as const].map(link => (
                  <motion.div key={link.to} variants={{ hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 20 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: reduce ? 0 : .4 }}>
                    <Link to={link.to} onClick={() => setOpen(false)}>{link.label}</Link>
                  </motion.div>
                ))}
              </motion.nav>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </motion.nav>
    </>
  );
}
