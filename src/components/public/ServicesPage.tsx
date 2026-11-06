import { Link, useLocation } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useMotionPreference } from '@/hooks/use-motion-preference';
import { filterServicesByGoal, serviceGoals, toggleServiceGoal, type ServiceGoal } from '@/data/service-goals';
import { Reveal } from '@/components/motion/Reveal';
import { publishedServices, visibleCategories, serviceAliases } from '@/data/services';
import { ServiceCatalogueCard } from '@/components/services/ServiceCatalogueCard';
import { Faq } from '@/components/home/Faq';
import { CtaStrip, Inclusions, PageHero } from './PageElements';
import { ServiceFinder } from '@/components/ServiceFinder';
export function ServicesPage() {
  const [goal, setGoal] = useState<ServiceGoal>('all');
  const reduce = useMotionPreference();
  const data = filterServicesByGoal(goal);
  const categories = visibleCategories(data);
  const hash = useLocation({ select: location => location.hash });
  useEffect(() => {
    if (!hash) return;
    const slug = serviceAliases[hash] || hash;
    const target = document.getElementById(slug);
    if (!target) return;
    const timer = window.setTimeout(() => {
      target.scrollIntoView({ block: 'start', behavior: 'instant' });
      target.classList.add('service-flash');
    }, 100);
    const end = window.setTimeout(() => target.classList.remove('service-flash'), 1200);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(end);
      target.classList.remove('service-flash');
    };
  }, [hash]);
  const transition = { duration: reduce ? 0 : .28, ease: [.22, 1, .36, 1] as const };
  return <div className="public-page">
    <ServiceFinder onBrowse={category => {
      setGoal('all');
      window.setTimeout(() => document.getElementById(category ?? 'service-catalogue')?.scrollIntoView({ block: 'start', behavior: reduce ? 'instant' : 'smooth' }), reduce ? 0 : 320);
    }}/>
    <PageHero eyebrow="Services" title={`${publishedServices().length} ways to make an ad without a shoot.`} intro="Pick a service, or tell us the job and we will pick for you."/>
    <section className="container-site services-layout" id="service-catalogue">
      <nav className="service-index" aria-label="Service families">{categories.map(category => <Link to="/services" hash={category.id} key={category.id}>{category.name}</Link>)}</nav>
      <div className="service-catalogue-content">
        <div className="service-goal-filter" role="group" aria-labelledby="service-goal-label">
          <h2 id="service-goal-label">Which service do I need?</h2>
          <div className="service-goal-chips">{serviceGoals.map(item => <Button key={item.id} variant="ghost" className={`filter-pill service-goal-chip ${goal === item.id ? 'active' : ''}`} aria-pressed={goal === item.id} onClick={() => setGoal(current => toggleServiceGoal(current, item.id))}>{item.label}</Button>)}</div>
          <p className="service-goal-count" role="status" aria-live="polite" aria-atomic="true">Showing {data.length} services</p>
        </div>
        <AnimatePresence initial={false} mode="popLayout">
          {categories.map(category => <motion.section className="service-family service-filter-family" id={category.id} key={category.id} layout={!reduce} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition}>
            <Reveal><h2 className="section-title serif">{category.name}</h2><p className="family-intro">{category.intro}</p></Reveal>
            <div className="service-grid service-catalogue-grid">
              <AnimatePresence initial={false} mode="popLayout" propagate>
                {data.filter(service => service.category === category.id).map((service, index) => <motion.div key={service.slug} layout={!reduce} initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : -8 }} transition={transition}><ServiceCatalogueCard service={service} index={index}/></motion.div>)}
              </AnimatePresence>
            </div>
          </motion.section>)}
        </AnimatePresence>
      </div>
    </section>
    <Inclusions/><Faq/><CtaStrip/>
  </div>;
}
