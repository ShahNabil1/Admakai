import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useMotionPreference } from '@/hooks/use-motion-preference';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getNavbarScrollState } from '@/lib/navbar-scroll';
import { CurrencySwitcher } from '@/components/CurrencySwitcher';
import '@/components/home/hero.css';
import { AccountMenu, MobileAccountSection } from '@/components/account/AccountMenu';
import { useAuth } from '@/lib/auth-state';

const links = [
  { label: 'Pricing', to: '/pricing' },
  { label: 'Services', to: '/services' },
  { label: 'Our Work', to: '/work' },
  { label: 'About', to: '/about' },
  { label: 'Blog', to: '/blog' },
  { label: 'Careers', to: '/careers' },
] as const;

export function Navbar({ hero = false }: { hero?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scroll, setScroll] = useState({ scrolled: false, hidden: false });
  const previousY = useRef(0);
  const reduce = useMotionPreference();
  const { user, ready } = useAuth();
  useEffect(() => {
    if (!hero) return;
    previousY.current = Math.max(0, window.scrollY);
    setScroll({ scrolled: window.scrollY > 80, hidden: false });
    const onScroll = () => {
      const y = Math.max(0, window.scrollY);
      const previous = previousY.current;
      previousY.current = y;
      setScroll(state => getNavbarScrollState(y, previous, state.hidden));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [hero]);
  if (!hero) return <nav>Navbar</nav>;

  return (
    <header className={`hero-navbar-wrapper${scroll.scrolled ? ' is-scrolled' : ''}`}>
      <motion.nav className="hero-navbar" aria-label="Main navigation" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : .2, duration: reduce ? 0 : .6 }}>
        <Link to="/" aria-label="Admakai home"><img className="hero-logo" src="/brand/logo-white.png" alt="Admakai" width="218" height="44" /></Link>
        <div className="hero-nav-links">
          {links.map(link => <Link key={link.to} to={link.to} className="hero-nav-link">{link.label}</Link>)}
        </div>
        <div className="navbar-currency-actions"><CurrencySwitcher location="header"/><AccountMenu /><Button asChild className="hero-nav-call"><Link to="/book">Book a call</Link></Button></div>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild><Button variant="ghost" size="icon" className="hero-menu-trigger" aria-label="Open menu"><span className="hero-menu-icon" aria-hidden="true"><span /><span /></span></Button></Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Content className="hero-mobile-menu" aria-describedby={undefined}>
              <Dialog.Title className="sr-only">Navigation</Dialog.Title>
              <Link to="/" onClick={() => setOpen(false)} aria-label="Admakai home"><img className="hero-logo" src="/brand/logo-white.png" alt="Admakai" width="218" height="44" /></Link>
              <Dialog.Close asChild><Button variant="ghost" size="icon" className="hero-menu-close" aria-label="Close menu"><X /></Button></Dialog.Close>
              <motion.nav className="hero-menu-items" aria-label="Mobile navigation" initial="hidden" animate="visible" transition={{ staggerChildren: reduce ? 0 : .05 }}>
                <MobileAccountSection onNavigate={() => setOpen(false)} />
                {[...links, { label: 'Book a call', to: '/book' } as const].map(link => (
                  <motion.div key={link.to} variants={{ hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 20 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: reduce ? 0 : .4 }}>
                    <Link to={link.to} onClick={() => setOpen(false)}>{link.label}</Link>
                  </motion.div>
                ))}
                {ready && !user && <Link to="/signin" className="account-mobile-signin" onClick={() => setOpen(false)}>Sign in</Link>}
              </motion.nav>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </motion.nav>
    </header>
  );
}
