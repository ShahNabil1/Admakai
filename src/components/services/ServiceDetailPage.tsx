import { Link } from '@tanstack/react-router';
import { ArrowUpRight, Check, ChevronRight, Clapperboard, Globe, Megaphone, MonitorPlay, Play, Presentation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TrustedClients } from '@/components/home/TrustedClients';
import { clients } from '@/data/clients';
import { serviceCategories, type Service } from '@/data/services';
import { servicePortfolio } from '@/data/portfolioDefaults';
import { proof } from '@/data/proof';
import { useCases, serviceDeliveryTerms } from '@/data/useCases';
import { ServiceLandingReveal } from './ServiceLandingMotion';
import { ServicePortfolio } from './ServicePortfolio';
import './service-detail.css';

const icons = [Megaphone, Play, Clapperboard, Globe, MonitorPlay, Presentation];
const steps = [
  { name: 'Brief', line: 'You tell us the product, the goal and where it will run.', chips: ['Goal', 'Audience', 'Platforms'] },
  { name: 'Concept and script', line: 'We send the idea, hooks and script for approval.', chips: ['Concept', 'Script', 'Hooks'] },
  { name: 'Production', line: 'We generate, edit, grade and add voice and music.', chips: ['AI generation', 'Edit', 'Sound'] },
  { name: 'Review', line: `You get ${serviceDeliveryTerms.revisionRounds === 2 ? 'two' : serviceDeliveryTerms.revisionRounds} rounds of changes.`, chips: ['Revision 1', 'Revision 2'] },
  { name: 'Delivery', line: 'Final files in every format you need.', chips: ['Captions'] },
];
function Heading({ number, label, title, intro }: { number: string; label: string; title: string; intro?: string }) {
  return <ServiceLandingReveal><p className="service-sd-eyebrow"><span>{number}</span>{label}</p><h2 className="service-sd-h2">{title}</h2>{intro && <p className="service-sd-intro">{intro}</p>}</ServiceLandingReveal>;
}
function Call({ service, children, light = false }: { service: Service; children: string; light?: boolean }) {
  return <Button asChild className={`service-sd-button${light ? ' service-sd-button-light' : ''}`}><Link to="/book" search={{ service: service.slug }}>{children}<ArrowUpRight size={18}/></Link></Button>;
}
function scrollToWork() {
  document.getElementById('service-work')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}
export function ServiceDetailPage({ service }: { service: Service }) {
  const category = serviceCategories.find(item => item.id === service.category);
  const stat = proof[service.slug]?.problemStat;
  return <div className="service-sd-page">
    <nav className="service-sd-breadcrumb service-sd-inner" aria-label="Breadcrumb"><Link to="/">Home</Link><ChevronRight size={14}/><Link to="/services">Services</Link><ChevronRight size={14}/><span aria-current="page">{service.name}</span></nav>
    <section className="service-sd-hero">
      <div className="service-sd-inner">
        <ServiceLandingReveal><div className="service-sd-pills"><span>{category?.name} service</span>{service.isNew && <span>New</span>}{service.featured && <span className="service-sd-popular">Popular</span>}</div>
          <h1 className="service-sd-title">{service.heroTitle.lead} <em>{service.heroTitle.accent}</em> {service.heroTitle.rest}</h1>
          <p className="service-sd-description">{service.description}</p>
          <div className="service-sd-hero-actions"><Call service={service}>Book a free call</Call><Button className="service-sd-button service-sd-button-secondary" disabled title="Pricing section will follow in the next update">See pricing</Button></div>
          <ul className="service-sd-checklist">{[`Delivery in ${service.delivery}`, service.formats, 'Two revision rounds', 'Bangla or English', 'Final files are yours'].map(item => <li key={item}><Check size={15} aria-hidden="true"/>{item}</li>)}</ul>
        </ServiceLandingReveal>
      </div>
    </section>
    {clients.length > 0 && <div className="service-sd-clients"><p className="service-sd-client-label">Brands that trust Admakai</p><TrustedClients/></div>}
    <section id="service-work" className="service-sd-section service-sd-dark">
      <div className="service-sd-inner"><Heading number="03" label="Our work" title={`Made with ${service.name}`} intro="Real projects, made with AI, no shoot."/><ServicePortfolio items={servicePortfolio(service)}/></div>
    </section>
    <section className="service-sd-section">
      <div className="service-sd-inner"><Heading number="04" label="The reality" title="Sound familiar?"/><div className={`service-sd-problems${stat ? ' service-sd-problems-with-stat' : ''}`}>
        {stat && <ServiceLandingReveal><aside className="service-sd-stat"><strong>{stat.value}</strong><p>{stat.caption}</p><a href={stat.sourceUrl} target="_blank" rel="noreferrer">{stat.sourceLabel}<ArrowUpRight size={14}/></a></aside></ServiceLandingReveal>}
        <div className="service-sd-grid service-sd-problem-grid">{service.signsYouNeedIt.slice(0, 3).map((item, index) => <ServiceLandingReveal key={item} delay={index * .06}><article className="service-sd-card service-sd-problem"><span className="service-sd-number">{String(index + 1).padStart(2, '0')}</span><p>{item}</p></article></ServiceLandingReveal>)}</div>
      </div></div>
    </section>
    <section className="service-sd-section service-sd-soft">
      <div className="service-sd-inner"><Heading number="05" label="What you get" title="Everything in the box"/><div className="service-sd-grid">{service.whatYouGet.map((item, index) => <ServiceLandingReveal key={item} delay={index * .06}><article className="service-sd-card service-sd-deliverable"><span className="service-sd-yellow-number">{String(index + 1).padStart(2, '0')}</span><p>{item}</p></article></ServiceLandingReveal>)}</div>
        <ServiceLandingReveal><div className="service-sd-quote-band"><h3>Want this for your brand?</h3><Call service={service} light>Get my quote</Call></div></ServiceLandingReveal>
      </div>
    </section>
    <section className="service-sd-section">
      <div className="service-sd-inner"><Heading number="06" label="Application areas" title="Where it works"/><div className="service-sd-grid">{(useCases[service.category] ?? []).map((item, index) => { const Icon = icons[index] ?? Globe; return <ServiceLandingReveal key={item.title} delay={index * .06}><article className="service-sd-card service-sd-use"><Icon size={28} strokeWidth={1.5} aria-hidden="true"/><h3>{item.title}</h3><p>{item.description}</p></article></ServiceLandingReveal>; })}</div><Button variant="link" className="service-sd-examples" onClick={scrollToWork}>See examples<ArrowUpRight size={16}/></Button></div>
    </section>
    <section className="service-sd-section service-sd-process">
      <div className="service-sd-inner"><Heading number="07" label="How it works" title={`From brief to delivery in ${service.delivery}`} intro="Every step ends with something you can review."/>
        <ol className="service-sd-timeline">{steps.map((step, index) => <li key={step.name}><span className="service-sd-timeline-dot"/><span>{step.name}</span><span className="service-sd-timeline-count">{String(index + 1).padStart(2, '0')}</span></li>)}</ol>
        <div className="service-sd-steps">{steps.map((step, index) => <ServiceLandingReveal key={step.name} delay={index * .06}><article><span className="service-sd-step-number">{String(index + 1).padStart(2, '0')}</span><h3>{step.name}</h3><p>{step.line}</p><ul className="service-sd-step-chips">{(index === 4 ? [service.formats, ...step.chips] : step.chips).map(chip => <li key={chip}>{chip}</li>)}</ul></article></ServiceLandingReveal>)}</div>
        <ServiceLandingReveal><div className="service-sd-rush"><div><h3>Need it faster?</h3><p>Delivery in {serviceDeliveryTerms.rushHours} hours is available for {serviceDeliveryTerms.rushExtraPercent}% extra.</p></div><Call service={service}>Discuss your deadline</Call></div></ServiceLandingReveal>
      </div>
    </section>
  </div>;
}
