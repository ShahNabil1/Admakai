import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useMotionPreference } from '@/hooks/use-motion-preference';
import { type Service, serviceCardFigure } from '@/data/services';
import './catalogue.css';
import { ServicePrice } from './ServicePrice';

export function ServiceCatalogueCard({ service, index = 0 }: { service: Service; index?: number }) {
  const reduce = useMotionPreference();
  const { figure } = serviceCardFigure(service);
  const unit = 'delivery';
  return <motion.div className="service-catalogue-entry" initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .1 }}>
    <motion.article className={`service-catalogue-card${service.featured ? ' service-catalogue-featured' : ''}`} id={service.slug} initial={reduce ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .1 }} transition={{ duration: reduce ? 0 : .4, delay: reduce ? 0 : (index % 3) * .07 }}>
      <div className="service-catalogue-top">
        <div className="service-catalogue-heading"><h3>{service.name}</h3><div className="service-catalogue-badges">{service.featured && <span className="service-catalogue-popular">Popular</span>}{service.isNew && <span>New</span>}</div></div>
        <div className="service-catalogue-figure"><strong>{figure}</strong><span>{unit}</span></div>
        <p className="service-catalogue-estimate"><ServicePrice service={service}/></p>
        <p className="service-catalogue-description">{service.shortDescription}</p>
      </div>
      <h4 className="service-catalogue-inclusions-title">What you get</h4>
      <ul className="service-catalogue-checklist">{service.whatYouGet.slice(0, 5).map(item => <li key={item}>{item}</li>)}</ul>
      <p className="service-catalogue-formats">Formats: {service.formats}</p>
      <Button asChild variant="outline" className="service-catalogue-link"><Link to="/services/$slug" params={{ slug: service.slug }} aria-label={`View details: ${service.name}`}>View details</Link></Button>
    </motion.article>
  </motion.div>;
}