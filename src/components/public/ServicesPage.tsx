import { useLocation } from '@tanstack/react-router';
import { useEffect, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useMotionPreference } from '@/hooks/use-motion-preference';
import { filterServicesByGoal, serviceGoals, toggleServiceGoal, type ServiceGoal } from '@/data/service-goals';
import { filterServicesByCategory, serviceCategoryTabs, type ServiceCategoryFilter } from '@/data/service-category-filter';
import footerImage from "@/assets/services-sky-hills.png.asset.json";
import { Reveal } from '@/components/motion/Reveal';
import { publishedServices, visibleCategories, serviceAliases } from '@/data/services';
import { ServiceCatalogueCard } from '@/components/services/ServiceCatalogueCard';
import { Faq } from '@/components/home/Faq';
import { CtaStrip, Inclusions } from './PageElements';
import { ServiceFinder } from '@/components/ServiceFinder';
import { useCurrency } from '@/lib/currency';
export function ServicesPage() {
  const { currency } = useCurrency();
  const [goal, setGoal] = useState<ServiceGoal>('all');
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategoryFilter>('all');
  const reduce = useMotionPreference();
  const data = filterServicesByCategory(categoryFilter, filterServicesByGoal(goal));
  const categories = visibleCategories(data);
  const hash = useLocation({ select: location => location.hash });
  useEffect(() => {
    if (!hash) return;
    setCategoryFilter('all');
    setGoal('all');
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
      setCategoryFilter('all');
      window.setTimeout(() => document.getElementById(category ?? 'service-catalogue')?.scrollIntoView({ block: 'start', behavior: reduce ? 'instant' : 'smooth' }), reduce ? 0 : 320);
    }}/>
    <section className="service-catalogue-section" id="service-catalogue" style={{ '--service-catalogue-photo': `url("${footerImage.url}")` } as CSSProperties}>
      <div className="service-catalogue-section-inner">
      <header className="service-catalogue-section-header"><h2>{publishedServices().length} ways to make an ad without a shoot.</h2>
        {currency !== 'USD' && <p className="service-catalogue-currency-note">Prices are set in USD and converted at today's rate.</p>}
        <div className="service-category-tabs" role="group" aria-label="Service categories">{serviceCategoryTabs.map(tab => <Button key={tab.id} variant="ghost" aria-pressed={categoryFilter === tab.id} className={`service-category-tab${categoryFilter === tab.id ? ' active' : ''}`} onClick={() => { setCategoryFilter(tab.id); setGoal('all'); }}>{tab.label}</Button>)}</div>
      </header>
      <div className="service-catalogue-content">
        <div className="service-goal-filter" role="group" aria-labelledby="service-goal-label">
          <h2 id="service-goal-label">Which service do I need?</h2>
          <div className="service-goal-chips">{serviceGoals.map(item => <Button key={item.id} variant="ghost" className={`filter-pill service-goal-chip ${goal === item.id ? 'active' : ''}`} aria-pressed={goal === item.id} onClick={() => setGoal(current => toggleServiceGoal(current, item.id))}>{item.label}</Button>)}</div>
          <p className="service-goal-count" role="status" aria-live="polite" aria-atomic="true">Showing {data.length} services</p>
        </div>
        <AnimatePresence initial={false} mode="popLayout">
          {categories.map(category => <motion.section className="service-family service-filter-family" id={category.id} key={category.id} layout={!reduce} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition}>
            <Reveal><h2 className="service-category-heading">{category.name}</h2><p className="family-intro">{category.intro}</p></Reveal>
            <div className="service-grid service-catalogue-grid">
              <AnimatePresence initial={false} mode="popLayout" propagate>
                {data.filter(service => service.category === category.id).map((service, index) => <motion.div key={service.slug} layout={!reduce} initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : -8 }} transition={transition}><ServiceCatalogueCard service={service} index={index}/></motion.div>)}
              </AnimatePresence>
            </div>
          </motion.section>)}
        </AnimatePresence>
      </div>
      </div>
    </section>
    <Inclusions/><Faq/><CtaStrip/>
  </div>;
}
