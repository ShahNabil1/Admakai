import { Link } from '@tanstack/react-router';
import { ArrowLeft, ArrowUpRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/motion/Reveal';
import { Magnetic } from '@/components/motion/Magnetic';
import { SplitText } from '@/components/motion/SplitText';
import { CtaStrip } from '@/components/public/PageElements';
import { detailInclusions, relatedServices, serviceCategories, servicePriceLine, type Service } from '@/data/services';
import { ServiceCatalogueCard } from './ServiceCatalogueCard';

function Checklist({ items }: { items: string[] }) {
  return <Reveal><ul className="service-detail-list">{items.map(item => <li key={item}><Check size={18} aria-hidden="true"/><span>{item}</span></li>)}</ul></Reveal>;
}

export function ServiceDetailPage({ service }: { service: Service }) {
  const category = serviceCategories.find(item => item.id === service.category);
  const related = relatedServices(service);
  return <div className="public-page">
    <header className="page-hero container-site">
      <Link to="/services" className="service-detail-back"><ArrowLeft size={15}/>All services</Link>
      <Reveal><nav className="page-breadcrumb" aria-label="Breadcrumb"><Link to="/services">Services</Link><span aria-hidden="true">/</span><Link to="/services" hash={service.category}>{category?.name}</Link><span aria-hidden="true">/</span><span aria-current="page">{service.name}</span></nav>
      <div className="service-detail-title"><h1><SplitText text={service.name}/></h1>{service.isNew && <span className="page-pill service-catalogue-new">New</span>}</div>
      <p className="page-intro">{service.description}</p>
      <div className="page-pills service-detail-info"><span className="page-pill">Formats: {service.formats}</span><span className="page-pill">Delivery: {service.delivery}</span><span className="page-pill">{servicePriceLine(service)}</span></div>
      <Magnetic><Button asChild className="page-call"><Link to="/book-a-call" search={{service:service.slug,plan:''}}>Book a call <ArrowUpRight size={18}/></Link></Button></Magnetic></Reveal>
    </header>
    <section className="container-site page-section page-section-top"><Reveal><h2 className="section-title serif">Who it's for</h2><div className="page-pills">{service.bestFor.map(item => <span className="page-pill" key={item}>{item}</span>)}</div></Reveal></section>
    <section className="container-site page-section"><Reveal><h2 className="section-title serif">You need this if</h2></Reveal><Checklist items={service.signsYouNeedIt}/></section>
    <section className="container-site page-section"><Reveal><h2 className="section-title serif">What you get</h2><ol className="service-detail-list service-detail-deliverables">{service.whatYouGet.map((item,i) => <li key={item}><span className="service-detail-number" aria-hidden="true">{String(i+1).padStart(2,'0')}</span><span>{item}</span></li>)}</ol></Reveal></section>
    <section className="container-site page-section"><Reveal><h2 className="section-title serif">What we need from you</h2></Reveal><Checklist items={service.whatWeNeed}/></section>
    <section className="page-paper page-section"><div className="container-site service-detail-included"><Reveal><h2 className="section-title serif">Included in every project</h2></Reveal><Checklist items={detailInclusions}/></div></section>
    {service.compareNote && <section className="container-site page-section"><Reveal><div className="service-detail-compare"><h2 className="section-title serif">Not sure which one?</h2><p className="page-intro">{service.compareNote}</p></div></Reveal></section>}
    {related.length > 0 && <section className="container-site page-section"><Reveal><h2 className="section-title serif">You might also need</h2></Reveal><div className="service-grid service-catalogue-grid">{related.map((item,i) => <Reveal key={item.slug} delay={i*.07}><ServiceCatalogueCard service={item}/></Reveal>)}</div></section>}
    <CtaStrip/>
  </div>;
}