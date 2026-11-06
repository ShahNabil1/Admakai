import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import type { WorkWithLinks } from '@/lib/works';
import { formatDuration } from '@/lib/vimeo';
import { CtaStrip } from './PageElements';
import './work-page.css';

/** Public detail page for a works-table video, reached from /work cards. */
export function WorkDetailPage({ work }: { work: WorkWithLinks }) {
  const meta = [work.client_name || 'Admakai', work.work_categories?.name, work.industry, work.year].filter(Boolean).join(' · ');
  const study = work.case_study ?? {};
  const hasStudy = Boolean(study.overview || study.problems?.length || study.solutions?.length || study.process?.length || study.result || study.metrics?.length || study.testimonial?.quote);
  return (
    <div className="public-page workpage workpage-detail">
      <main className="container-site workpage-detail-main">
        <Link to="/work" className="workpage-back"><ArrowLeft size={16} /> All work</Link>
        <div className="workpage-player">
          <iframe
            title={work.title}
            src={`https://player.vimeo.com/video/${work.vimeo_id}?title=0&byline=0&portrait=0`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
        <header className="workpage-detail-head">
          <h1>{work.title}</h1>
          <p className="workpage-detail-meta">{meta}{work.duration_sec ? ` · ${formatDuration(work.duration_sec)}` : ''}</p>
          {work.short_description && <p className="workpage-detail-desc">{work.short_description}</p>}
          {work.tags.length > 0 && <div className="workpage-chips workpage-detail-tags">{work.tags.map((t) => <span key={t}>{t}</span>)}</div>}
        </header>

        {hasStudy && (
          <section className="workpage-study" aria-label="Case study">
            {study.is_sample && <p className="workpage-sample">Sample case study, shown to explain how we work. Not a real client project.</p>}
            {study.overview && <div><h2>Overview</h2><p>{study.overview}</p></div>}
            {!!study.problems?.length && <div><h2>Problems</h2><ul>{study.problems.map((p, i) => <li key={i}>{p}</li>)}</ul></div>}
            {!!study.solutions?.length && <div><h2>Solutions</h2><ul>{study.solutions.map((s, i) => <li key={i}>{s}</li>)}</ul></div>}
            {!!study.process?.length && (
              <div><h2>Process</h2><ol className="workpage-process">{study.process.map((s, i) => <li key={i}><strong>{s.title}</strong><p>{s.body}</p></li>)}</ol></div>
            )}
            {!!study.tools?.length && <div><h2>Tools</h2><div className="workpage-chips workpage-detail-tags">{study.tools.map((t) => <span key={t}>{t}</span>)}</div></div>}
            {!!study.deliverables?.length && <div><h2>Deliverables</h2><ul>{study.deliverables.map((d, i) => <li key={i}>{d}</li>)}</ul></div>}
            {study.result && <div><h2>Result</h2><p>{study.result}</p></div>}
            {!!study.metrics?.length && (
              <div className="workpage-metrics">{study.metrics.map((m, i) => <div key={i}><b>{m.value}</b><span>{m.label}</span></div>)}</div>
            )}
            {study.testimonial?.quote && (
              <blockquote className="workpage-quote">
                <p>&ldquo;{study.testimonial.quote}&rdquo;</p>
                <footer>{study.testimonial.name}{study.testimonial.role ? `, ${study.testimonial.role}` : ''}</footer>
              </blockquote>
            )}
          </section>
        )}
      </main>
      <CtaStrip title="Want one of these for your brand?" />
    </div>
  );
}
