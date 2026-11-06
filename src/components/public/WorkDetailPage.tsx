import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Check, Pencil, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { formatDuration } from '@/lib/vimeo';
import { rankUpNext } from '@/lib/work-search';
import { publishedWorksQueryOptions, type WorkWithLinks } from '@/lib/works';
import { findPublishedService, type Service } from '@/data/services';
import { useCurrency } from '@/lib/currency';
import { VideoPreviewCard } from '@/components/VideoPreviewCard';
import { Reveal } from '@/components/motion/Reveal';

/** Public work detail: a YouTube-style watch page with the case study below. */
export function WorkDetailPage({ work }: { work: WorkWithLinks }) {
  const { formatRange } = useCurrency();
  const [expanded, setExpanded] = useState(false);
  const [needsUnmute, setNeedsUnmute] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<import('@vimeo/player').default | null>(null);

  const services = useMemo(
    () => [...(work.work_services ?? [])].sort((a,b) => a.position - b.position).map((link) => findPublishedService(link.service_slug)).filter((service): service is Service => service != null),
    [work.work_services],
  );
  const firstService = services[0];

  const allWorks = useQuery(publishedWorksQueryOptions);
  const upNext = useMemo(() => (allWorks.data ? rankUpNext(work, allWorks.data) : []), [allWorks.data, work]);
  const moreWorks = useMemo(() => upNext.slice(0, 3), [upNext]);

  const study = work.case_study;
  const problems: string[] = study?.problems ?? [];
  const solutions: string[] = study?.solutions ?? [];
  const processSteps: { title: string; body: string }[] = study?.process ?? [];
  const tools: string[] = study?.tools ?? [];
  const deliverables: string[] = study?.deliverables ?? [];
  const metrics: { label: string; value: string }[] = study?.metrics ?? [];
  const hasCaseStudy = Boolean(
    study && (study.overview || problems.length || solutions.length || processSteps.length || tools.length || deliverables.length || study.result || metrics.length || study.testimonial),
  );

  useEffect(() => {
    let disposed = false;
    let player: import('@vimeo/player').default | null = null;
    void import('@vimeo/player').then(({ default: Player }) => {
      if (disposed || !stageRef.current) return;
      const instance = new Player(stageRef.current, {
        id: Number(work.vimeo_id),
        autoplay: true,
        muted: true,
        dnt: true,
        title: false,
        byline: false,
        portrait: false,
        responsive: true,
      });
      player = instance;
      playerRef.current = instance;
      setNeedsUnmute(true);
      instance.play().catch(() => {
        void instance.setMuted(true).then(() => instance.play());
        if (!disposed) setNeedsUnmute(true);
      });
    });
    return () => {
      disposed = true;
      playerRef.current = null;
      void player?.destroy();
    };
  }, [work.vimeo_id]);

  useEffect(() => {
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: row } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).maybeSingle();
      if (row && (row.role === 'owner' || row.role === 'manager')) setIsAdmin(true);
    });
  }, []);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: work.title, url });
        return;
      } catch {
        return;
      }
    }
    await navigator.clipboard.writeText(url);
    toast.success('Link copied');
  };

  const metaLine = [work.work_categories?.name, work.industry, work.year ? String(work.year) : null, formatDuration(work.duration_sec)].filter(Boolean).join(' · ');
  const hashtags = work.tags.map((tag: string) => `#${tag.toLowerCase().replace(/\s+/g, '')}`);
  const ratio = work.aspect.replace(':', ' / ');

  return (
    <section className="workpage-watch">
      <div className="container-site workpage-watch-grid">
        <div className="workpage-watch-main">
          <div className="workpage-stage" style={{ '--workpage-ratio': ratio } as React.CSSProperties}>
            <div className="workpage-stage-inner" ref={stageRef} />
            {needsUnmute ? (
              <button
                type="button"
                className="workpage-unmute"
                onClick={() => {
                  void playerRef.current?.setMuted(false).then(() => playerRef.current?.setVolume(1));
                  setNeedsUnmute(false);
                }}
              >
                Tap to unmute
              </button>
            ) : null}
          </div>

          <div className="workpage-watch-head">
            <h1>{work.title}</h1>
            <div className="workpage-watch-actions">
              <div className="workpage-watch-brand">
                <img src="/brand/icon-512.png" alt="Admakai" width={40} height={40} />
                <div>
                  <strong>Admakai</strong>
                  {work.client_name ? <span>{work.client_name}</span> : null}
                </div>
              </div>
              <div className="workpage-watch-buttons">
                <Link to="/book" search={firstService ? {service: firstService.slug} : {}} className="workpage-cta-button">
                  Get a video like this
                </Link>
                <button type="button" className="workpage-share" onClick={() => void share()}>
                  <Share2 size={16} /> Share
                </button>
              </div>
            </div>
            {services.length ? (
              <div className="workpage-watch-services">
                {services.map((service) => (
                  <Link key={service.slug} to="/services/$slug" params={{ slug: service.slug }} className="workpage-service-chip" title={`Estimated ${formatRange(service.priceMinUsd, service.priceMaxUsd)} per ${service.priceUnit}`}>
                    {service.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <div className={`workpage-description${expanded ? ' expanded' : ''}`}>
            <p className="workpage-description-meta">{metaLine}</p>
            <div className="workpage-description-body">
              <p>{work.short_description}</p>
              {hashtags.length ? <p className="workpage-description-tags">{hashtags.join(' ')}</p> : null}
            </div>
            <button type="button" className="workpage-description-toggle" onClick={() => setExpanded((value) => !value)}>
              {expanded ? 'Show less' : '...more'}
            </button>
          </div>

          {hasCaseStudy && study ? (
            <div className="workpage-study">
              <Reveal>
                <div className="workpage-study-head">
                  <h2>Case study</h2>
                  {study.is_sample && isAdmin ? (
                    <a href={`/admin?tab=work&work=edit&work_id=${work.id}`} className="workpage-sample-badge">
                      <Pencil size={12} /> Sample case study, edit in admin
                    </a>
                  ) : null}
                </div>
              </Reveal>

              <Reveal>
                <div className="workpage-study-meta">
                  <div><small>Industry</small><strong>{work.industry ?? 'Not specified'}</strong></div>
                  <div><small>Service</small><strong>{firstService?.name ?? 'Not linked'}</strong></div>
                  <div><small>Format</small><strong>{work.aspect}{work.duration_sec ? `, ${formatDuration(work.duration_sec)}` : ''}</strong></div>
                  {work.client_name ? <div><small>Client</small><strong>{work.client_name}</strong></div> : null}
                </div>
              </Reveal>

              {study.overview ? (
                <Reveal>
                  <div className="workpage-study-section">
                    <h3>Project overview</h3>
                    <p>{study.overview}</p>
                  </div>
                </Reveal>
              ) : null}

              {problems.length ? (
                <Reveal>
                  <div className="workpage-study-section">
                    <h3>The problem</h3>
                    <div className="workpage-study-cards">
                      {problems.map((problem, index) => (
                        <div key={index} className="workpage-study-card">
                          <span>{String(index + 1).padStart(2, '0')}</span>
                          <p>{problem}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ) : null}

              {solutions.length ? (
                <Reveal>
                  <div className="workpage-study-section workpage-study-band">
                    <h3>Our solution</h3>
                    <div className="workpage-study-cards">
                      {solutions.map((solution, index) => (
                        <div key={index} className="workpage-study-card">
                          <span>{String(index + 1).padStart(2, '0')}</span>
                          <p>{solution}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ) : null}

              {processSteps.length ? (
                <Reveal>
                  <div className="workpage-study-section">
                    <h3>How we made it</h3>
                    <ol className="workpage-study-steps">
                      {processSteps.map((step, index) => (
                        <li key={index}>
                          <span>{String(index + 1).padStart(2, '0')}</span>
                          <strong>{step.title}</strong>
                          <p>{step.body}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                </Reveal>
              ) : null}

              {tools.length || deliverables.length ? (
                <Reveal>
                  <div className="workpage-study-section workpage-study-twocol">
                    {tools.length ? (
                      <div>
                        <h3>Tools</h3>
                        <div className="workpage-study-tools">
                          {tools.map((tool) => <span key={tool}>{tool}</span>)}
                        </div>
                      </div>
                    ) : null}
                    {deliverables.length ? (
                      <div>
                        <h3>Deliverables</h3>
                        <ul className="workpage-study-deliverables">
                          {deliverables.map((item) => <li key={item}><Check size={15} /> {item}</li>)}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </Reveal>
              ) : null}

              {study.result || metrics.length ? (
                <Reveal>
                  <div className="workpage-study-section">
                    <h3>The result</h3>
                    {study.result ? <p>{study.result}</p> : null}
                    {metrics.length ? (
                      <div className="workpage-study-metrics">
                        {metrics.map((metric, index) => (
                          <div key={index}>
                            <strong>{metric.value}</strong>
                            <small>{metric.label}</small>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Reveal>
              ) : null}

              {study.testimonial ? (
                <Reveal>
                  <blockquote className="workpage-study-quote">
                    <p>{study.testimonial.quote}</p>
                    <footer>{study.testimonial.name}{study.testimonial.role ? `, ${study.testimonial.role}` : ''}</footer>
                  </blockquote>
                </Reveal>
              ) : null}
            </div>
          ) : null}
        </div>

        <aside className="workpage-rail">
          <h2>Up next</h2>
          {allWorks.isPending ? (
            <div className="workpage-rail-list">
              {Array.from({ length: 5 }, (_, i) => <div key={i} className="workpage-rail-skeleton" />)}
            </div>
          ) : (
            <div className="workpage-rail-list">
              {upNext.map((item) => <UpNextRow key={item.id} work={item} />)}
            </div>
          )}
        </aside>
      </div>

      <div className="workpage-watch-cta">
        <div className="container-site">
          <h2>Want a <em>video</em> like this?</h2>
          <div>
            <Link to="/book" search={firstService ? {service: firstService.slug} : {}} className="workpage-cta-button">Book a free call</Link>
            {firstService ? (
              <Link to="/services/$slug" params={{ slug: firstService.slug }} className="workpage-cta-link">
                See the service <ArrowRight size={15} />
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {moreWorks.length ? (
        <div className="container-site workpage-more">
          <div className="workpage-more-head">
            <h2>More from our work</h2>
            <Link to="/work" className="workpage-more-link">See all work <ArrowRight size={15} /></Link>
          </div>
          <div className="workpage-more-grid">
            {moreWorks.map((item) => <MoreCard key={item.id} work={item} />)}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function UpNextRow({ work }: { work: WorkWithLinks }) {
  return <div className="workpage-rail-row">
    <VideoPreviewCard work={work} className="workpage-rail-thumb" />
    <Link to="/work/$slug" params={{ slug: work.slug }} className="workpage-rail-info"><strong>{work.title}</strong><small>{work.client_name ?? 'Admakai'}{work.work_categories?.name ? ` · ${work.work_categories.name}` : ''}</small></Link>
  </div>;
}

function MoreCard({ work }: { work: WorkWithLinks }) {
  return <article className="workpage-more-card">
    <VideoPreviewCard work={work} className="workpage-more-thumb" />
    <Link to="/work/$slug" params={{ slug: work.slug }} className="workpage-more-info">
      <img src="/brand/icon-512.png" alt="" width={32} height={32}/><span><strong>{work.title}</strong><small>{[work.client_name ?? 'Admakai', work.work_categories?.name, work.year].filter(Boolean).join(' · ')}</small></span>
    </Link>
  </article>;
}
