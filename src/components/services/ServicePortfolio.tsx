import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowLeft, ArrowRight, Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import type { WorkWithLinks } from '@/lib/works';
import { portfolioTags } from './portfolio-rules';
import { VideoPreviewCard } from '@/components/VideoPreviewCard';
import { VimeoPlayer } from './VimeoPlayer';
import { ServiceLandingReveal } from './ServiceLandingMotion';

const aspects = ['9:16', '16:9', '1:1', '9:16', '16:9', '1:1'] as const;
export function ServicePortfolio({ items }: { items: WorkWithLinks[] }) {
  const [tag, setTag] = useState('All');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: false });
  const row = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; scroll: number; moved: boolean } | null>(null);
  const tags = portfolioTags(items.map(item => item.work_categories?.name));
  const filtered = tag === 'All' ? items : items.filter(item => item.work_categories?.name === tag);
  const current = openIndex === null ? undefined : filtered[openIndex];
  const updateScroll = () => {
    const node = row.current; if (!node) return;
    const max = node.scrollWidth - node.clientWidth;
    setProgress(max > 0 ? node.scrollLeft / max : 1);
    setEdges({ start: node.scrollLeft < 2, end: max <= 0 || node.scrollLeft >= max - 2 });
  };
  useEffect(() => {
    const node = row.current; if (!node) return;
    const observer = new ResizeObserver(updateScroll); observer.observe(node); updateScroll();
    return () => observer.disconnect();
  }, [tag, items]);
  const scroll = (direction: number) => {
    const node = row.current; if (!node) return;
    node.scrollBy({ left: direction * node.clientWidth * .75, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  const next = (direction: number) => setOpenIndex(index => index === null ? null : (index + direction + filtered.length) % filtered.length);
  return <>
    <div className="service-sd-work-tools">
      {tags.length > 1 && <div className="service-sd-tabs" role="group" aria-label="Filter projects">{['All', ...tags].map(value => <Button key={value} variant="ghost" aria-pressed={tag === value} onClick={() => { setTag(value); row.current?.scrollTo({ left: 0 }); }}>{value}</Button>)}</div>}
      <div className="service-sd-arrows"><Button variant="ghost" size="icon" disabled={edges.start} aria-label="Previous projects" title="Previous projects" onClick={() => scroll(-1)}><ArrowLeft/></Button><Button variant="ghost" size="icon" disabled={edges.end} aria-label="Next projects" title="Next projects" onClick={() => scroll(1)}><ArrowRight/></Button></div>
    </div>
    <div ref={row} className="service-sd-portfolio-row" data-lenis-prevent onScroll={updateScroll}
      onPointerDown={event => { if (event.pointerType === 'mouse' && event.button === 0) drag.current = { x: event.clientX, scroll: event.currentTarget.scrollLeft, moved: false }; }}
      onPointerMove={event => { const start = drag.current; if (!start) return; const delta = event.clientX - start.x; if (Math.abs(delta) > 5) { start.moved = true; event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.scrollLeft = start.scroll - delta; } }}
      onPointerUp={() => { requestAnimationFrame(() => { drag.current = null; }); }} onPointerCancel={() => { drag.current = null; }} onPointerLeave={() => { if (!drag.current?.moved) drag.current = null; }}
      onClickCapture={event => { if (drag.current?.moved) { event.preventDefault(); event.stopPropagation(); } }}>
      {filtered.length ? filtered.map((item, index) => <ServiceLandingReveal key={`${tag}-${item.id}`} delay={index * .06} className={`service-sd-portfolio-card service-sd-aspect-${item.aspect.replace(':', '-')}`}><figure>
        <VideoPreviewCard work={item} vertical className="service-sd-portfolio-video" disabled={openIndex !== null} onOpen={() => setOpenIndex(index)}/>
        <figcaption><h3>{item.title}</h3>{item.client_name && <p>{item.client_name}</p>}<Link to="/work/$slug" params={{ slug: item.slug }} className="service-sd-case-link">View case study<ArrowRight size={14} aria-hidden="true"/></Link></figcaption>
      </figure></ServiceLandingReveal>) : aspects.map((aspect, index) => <ServiceLandingReveal key={index} delay={index * .06} className={`service-sd-portfolio-card service-sd-aspect-${aspect.replace(':', '-')}`}><div className="service-sd-portfolio-placeholder"><span className="service-sd-placeholder-play"><Play size={28} aria-hidden="true"/></span><span className="service-sd-coming">Coming soon</span></div></ServiceLandingReveal>)}
    </div>
    <div className="service-sd-progress" role="progressbar" aria-label="Portfolio scroll position" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}><span style={{ transform: `scaleX(${progress})` }}/></div>
    {items[0] && <p className="service-sd-see-all"><Link to="/work" search={{ cat: items[0].work_categories?.slug }}>See all our work<ArrowRight size={16} aria-hidden="true"/></Link></p>}
    <Dialog.Root open={Boolean(current)} onOpenChange={open => { if (!open) setOpenIndex(null); }}><Dialog.Portal><Dialog.Overlay className="service-sd-modal-overlay"/><Dialog.Content className="service-sd-modal" aria-describedby={undefined} data-lenis-prevent onKeyDown={event => { if (event.key === 'ArrowLeft') next(-1); if (event.key === 'ArrowRight') next(1); }}>
      <div className="service-sd-modal-top"><Dialog.Title>{current?.title}</Dialog.Title><Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Close video" title="Close video"><X/></Button></Dialog.Close></div>
      {current && <VimeoPlayer key={current.vimeo_id} videoKey={current.vimeo_id} videoData={{ id: current.vimeo_id, title: current.title, poster: current.thumbnail_url ?? '' }} mode="inline" aspect={current.aspect.replace(':', '/') as '9/16' | '16/9' | '1/1' | '4/5'} className="service-sd-modal-video"/>}
      {current && <Link to="/work/$slug" params={{ slug: current.slug }} className="service-sd-case-link service-sd-modal-case">View case study<ArrowRight size={14} aria-hidden="true"/></Link>}
      {filtered.length > 1 && <div className="service-sd-modal-nav"><Button variant="ghost" onClick={() => next(-1)}><ArrowLeft/>Previous video</Button><Button variant="ghost" onClick={() => next(1)}>Next video<ArrowRight/></Button></div>}
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </>;
}