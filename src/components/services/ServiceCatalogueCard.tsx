import { Link } from '@tanstack/react-router';
import { ArrowUpRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Service, servicePriceLine } from '@/data/services';
import './catalogue.css';

export function ServiceCatalogueCard({ service }: { service: Service }) {
  return <article className="service-card service-catalogue-card" id={service.slug}>
    <div className="service-catalogue-heading"><h3>{service.name}</h3>{service.isNew && <span className="page-pill service-catalogue-new">New</span>}</div>
    <p>{service.shortDescription}</p>
    <h4>What you get</h4>
    <ul className="service-catalogue-checklist">{service.whatYouGet.slice(0, 3).map(item => <li key={item}><Check size={15} aria-hidden="true"/><span>{item}</span></li>)}</ul>
    <div className="page-pills">{service.formats.split(', ').map(format => <span className="page-pill" key={format}>{format}</span>)}</div>
    <div className="service-card-footer"><span>{service.delivery}</span><strong>{servicePriceLine(service)}</strong></div>
    <Button asChild variant="link" className="service-start service-catalogue-link"><Link to="/services/$slug" params={{ slug: service.slug }} aria-label={`View details: ${service.name}`}>View details <ArrowUpRight size={16}/></Link></Button>
  </article>;
}