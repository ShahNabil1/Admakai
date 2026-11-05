import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ServiceReveal } from './ServiceMotion';
import './services.css';
export function CTABand({ headline, subline, primaryLabel = 'Book a free call', secondary }: { headline: string; subline: string; primaryLabel?: string; secondary: { label: string; href: string } }) {
  // An unavailable WhatsApp number is never replaced with an invented contact.
  const validSecondary = /^(https:\/\/|mailto:)/.test(secondary.href) && !secondary.href.includes('[number]');
  const secondaryControl: ReactNode = validSecondary ? <Button asChild variant="outline" className="service-action service-action--secondary"><a href={secondary.href}>{secondary.label}</a></Button> : <Button variant="outline" className="service-action service-action--secondary" disabled>{secondary.label}</Button>;
  return <section className="service-foundation service-cta"><div className="container-site"><ServiceReveal><h2>{headline}</h2><p>{subline}</p><div className="service-actions"><Button asChild className="service-action"><Link to="/book">{primaryLabel}</Link></Button>{secondaryControl}</div></ServiceReveal></div></section>;
}
