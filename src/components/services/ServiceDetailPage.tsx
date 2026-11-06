import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/motion/Reveal';
import { Magnetic } from '@/components/motion/Magnetic';
import { SplitText } from '@/components/motion/SplitText';
import { useMotionPreference } from '@/hooks/use-motion-preference';
import { detailInclusions, relatedServices, serviceCategories, servicePriceLine, type Service } from '@/data/services';
import { ServiceCatalogueCard } from './ServiceCatalogueCard';
import { ServiceHero } from './ServiceHero';
import './service-detail.css';

const ease = [0.22, 1, 0.36, 1] as const;

function Eyebrow({ children }: { children: string }) {
  return <p className="service-sd-eyebrow"><span className="service-sd-eyebrow-line" aria-hidden="true"/>{children}</p>;
}

export function ServiceDetailPage({ service }: { service: Service }) {
  const reduce = useMotionPreference();
  const category = serviceCategories.find(item => item.id === service.category);
  const related = relatedServices(service);
  const rise = (delay: number) => ({
    initial: reduce ? false as const : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: reduce ? 0 : delay, duration: reduce ? 0 : 0.7, ease },
  });
  return <div className="service-sd-page">
    <ServiceHero service={service}/>

    <section className="service-sd-dark">
      <div className="service-sd-inner service-sd-split">
        <Reveal><Eyebrow>Who it's for</Eyebrow><h2 className="service-sd-h2">Made for brands like yours</h2></Reveal>
        <Reveal delay={.1}><ul className="service-sd-chips">{service.bestFor.map(item => <li key={item}>{item}</li>)}</ul></Reveal>
      </div>
      <div className="service-sd-inner service-sd-block">
        <Reveal><Eyebrow>You need this if</Eyebrow></Reveal>
        <div className="service-sd-signs">{service.signsYouNeedIt.map((item, i) => <Reveal key={item} delay={i * .07}><article className="service-sd-card"><span className="service-sd-num">{String(i + 1).padStart(2, '0')}</span><p>{item}</p></article></Reveal>)}</div>
      </div>
    </section>

    <section className="service-sd-light">
      <div className="service-sd-inner service-sd-split">
        <Reveal><Eyebrow>What you get</Eyebrow><h2 className="service-sd-h2">Everything in the delivery</h2></Reveal>
        <ol className="service-sd-deliver">{service.whatYouGet.map((item, i) => <Reveal key={item} delay={i * .05}><li><span className="service-sd-num">{String(i + 1).padStart(2, '0')}</span><span>{item}</span></li></Reveal>)}</ol>
      </div>
    </section>

    <section className="service-sd-dark">
      <div className="service-sd-inner service-sd-two">
        <Reveal><div className="service-sd-panel"><Eyebrow>What we need from you</Eyebrow><ul className="service-sd-checks">{service.whatWeNeed.map(item => <li key={item}><Check size={16} aria-hidden="true"/>{item}</li>)}</ul></div></Reveal>
        <Reveal delay={.1}><div className="service-sd-panel"><Eyebrow>Included in every project</Eyebrow><ul className="service-sd-checks">{detailInclusions.map(item => <li key={item}><Check size={16} aria-hidden="true"/>{item}</li>)}</ul></div></Reveal>
      </div>
      {service.compareNote && <div className="service-sd-inner service-sd-block"><Reveal><div className="service-sd-compare"><Eyebrow>Not sure which one?</Eyebrow><p>{service.compareNote}</p></div></Reveal></div>}
    </section>

    {related.length > 0 && <section className="page-section service-catalogue-related"><div className="container-site"><Reveal><h2 className="section-title serif">You might also need</h2></Reveal><div className="service-grid service-catalogue-grid">{related.map((item, i) => <Reveal key={item.slug} delay={i * .07}><ServiceCatalogueCard service={item}/></Reveal>)}</div></div></section>}

    <section className="service-sd-dark service-sd-final">
      <div className="service-sd-inner">
        <Reveal><Eyebrow>Ready when you are</Eyebrow><h2 className="service-sd-h2 service-sd-final-title">Let's make your {service.name}.</h2>
          <p className="service-sd-final-sub">Tell us what you need on a short call and we will scope it, price it and plan the delivery.</p>
          <Magnetic><Button asChild className="service-sd-call"><Link to="/book" search={{ service: service.slug, plan: '' }}>Book a call <ArrowUpRight size={18}/></Link></Button></Magnetic></Reveal>
      </div>
    </section>
  </div>;
}
