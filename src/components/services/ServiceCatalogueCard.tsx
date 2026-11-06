import { Link } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useMotionPreference } from '@/hooks/use-motion-preference';
import { type Service, serviceCardFigure } from '@/data/services';
import './catalogue.css';

export function ServiceCatalogueCard({ service, index = 0 }: { service: Service; index?: number }) {
  const reduce = useMotionPreference();
  const { figure, caption, unit } = serviceCardFigure(service);
  return <motion.div className="service-catalogue-entry" initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .1 }}>
    <motion.article className={`service-catalogue-card${service.featured ? ' service-catalogue-featured' : ''}`} id={service.slug} initial={reduce ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .1 }} transition={{ duration: reduce ? 0 : .4, delay: reduce ? 0 : (index % 3) * .07 }}>
      <div className="service-catalogue-glow" aria-hidden="true"/>
      <div className="service-catalogue-top">
        <div className="service-catalogue-heading"><h3>{service.name}</h3><div className="service-catalogue-badges">{service.isNew && <span>New</span>}{service.featured && <span>Popular</span>}</div></div>
        <div className="service-catalogue-figure"><strong>{figure}</strong><span>{caption}<br/>{unit}</span></div>
        <Button asChild variant="outline" className="service-catalogue-link"><Link to="/services/$slug" params={{ slug: service.slug }} aria-label={`View details: ${service.name}`}>View details</Link></Button>
      </div>
      <ul className="service-catalogue-checklist">{service.whatYouGet.slice(0, 5).map(item => <li key={item}><Check size={18} aria-hidden="true"/><span>{item}</span></li>)}</ul>
      <p className="service-catalogue-formats">Formats: {service.formats}</p>
    </motion.article>
  </motion.div>;
}