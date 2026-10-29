import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { legalContactEmail, legalDocuments, legalEffectiveDate } from '@/data/legal';
import './pages.css';
import './legal.css';

const refundSections = [
  ['Eligibility', 'TODO: Add approved refund eligibility and exclusions.'],
  ['Requests and timing', 'TODO: Add the request process, contact details and refund processing timeline.'],
  ['Monthly guarantees', 'TODO: Confirm the written terms of the first-cut guarantee before publishing this policy.'],
];

export function LegalPage({ kind }: { kind: 'privacy' | 'terms' | 'refund' }) {
  if (kind === 'refund') return <div className="public-page"><article className="legal-document"><p className="page-eyebrow">Legal</p><h1>Refund policy</h1><p className="legal-todo">TODO: This is a placeholder, not an approved policy. Final legal text has not yet been supplied.</p>{refundSections.map(([title, text]) => <section key={title}><h2>{title}</h2><p>{text}</p></section>)}<Button asChild variant="link"><Link to="/book-a-call">Contact Admakai</Link></Button></article></div>;

  const doc = legalDocuments[kind];
  return <div className="public-page"><article className="legal-document">
    <p className="page-eyebrow">Legal</p>
    <h1>{doc.title}</h1>
    <p className="legal-intro">{doc.intro}</p>
    <p className="legal-date">Effective date: {legalEffectiveDate}</p>
    {doc.sections.map(section => <section key={section.title}>
      <h2>{section.title}</h2>
      {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
    </section>)}
    {kind === 'privacy' && <a className="legal-policy-link" href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>}
    <nav className="legal-links" aria-label="Legal and contact">
      <Button asChild variant="link"><a href={`mailto:${legalContactEmail}`}>{legalContactEmail}</a></Button>
      <Button asChild variant="link"><Link to={kind === 'privacy' ? '/terms' : '/privacy'}>{kind === 'privacy' ? 'Terms of service' : 'Privacy policy'}</Link></Button>
    </nav>
  </article></div>;
}
