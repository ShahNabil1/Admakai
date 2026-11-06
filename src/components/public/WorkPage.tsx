import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, getRouteApi } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Clapperboard, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { publishedWorksQueryOptions, workCategoriesQueryOptions, type WorkWithLinks } from '@/lib/works';
import { VideoPreviewCard } from '@/components/VideoPreviewCard';
import { Button } from '@/components/ui/button';
import { REELS_SHELF_AFTER, WORK_PAGE_SIZE, splitByOrientation, workMatchesQuery } from '@/lib/work-search';
import { services } from '@/data/services';
import { CtaStrip } from './PageElements';
import './work-page.css';

const route = getRouteApi('/_site/work/');
const serviceName = (slug: string) => services.find((s) => s.slug === slug)?.name ?? slug;
export function WorkCard({ work, vertical }: { work: WorkWithLinks; vertical?: boolean }) {
  const meta = [work.client_name || 'Admakai', work.work_categories?.name, work.year].filter(Boolean).join(' · ');
  return <article className={`workpage-card ${vertical ? 'is-vertical' : ''}`}>
    <VideoPreviewCard work={work} vertical={Boolean(vertical)} className="workpage-thumb" />
    <Link to="/work/$slug" params={{ slug: work.slug }} className="workpage-card-body">
      <img className="workpage-avatar" src="/brand/icon-512.png" alt="" width="36" height="36" loading="lazy" />
      <div className="min-w-0"><h2>{work.title}</h2><p>{meta}</p></div>
    </Link>
  </article>;
}

function SkeletonCards({ count, vertical }: { count: number; vertical?: boolean }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div className={`workpage-card is-skeleton ${vertical ? 'is-vertical' : ''}`} key={i} aria-hidden="true">
          <div className="workpage-thumb" />
          <div className="workpage-card-body"><span className="workpage-avatar" /><div className="workpage-skel-lines"><span /><span /></div></div>
        </div>
      ))}
    </>
  );
}

export function WorkPage() {
  const { cat, q } = route.useSearch();
  const navigate = route.useNavigate();
  const categoriesQuery = useQuery(workCategoriesQueryOptions);
  const worksQuery = useQuery(publishedWorksQueryOptions);
  const categories = categoriesQuery.data ?? [];
  const works = worksQuery.data ?? [];

  const [input, setInput] = useState(q ?? '');
  const [visible, setVisible] = useState(WORK_PAGE_SIZE);
  const searchRef = useRef<HTMLInputElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  const chipsRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  const activeCat = cat || 'all';
  const query = (q ?? '').trim();

  // Keep the input in sync when the URL changes (back button, shared links).
  useEffect(() => { setInput(q ?? ''); }, [q]);

  const setSearch = useCallback((next: { cat?: string; q?: string }) => {
    void navigate({
      search: (prev) => {
        const merged = { ...prev, ...next };
        const out: Record<string, string> = {};
        if (merged.cat) out['cat'] = merged.cat;
        if (merged.q) out['q'] = merged.q;
        return out;
      },
      replace: true,
    });
  }, [navigate]);

  const onInput = (value: string) => {
    setInput(value);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setSearch({ q: value.trim() }), 200);
  };

  // "/" focuses the search field, like YouTube.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filtered = useMemo(() => {
    return works.filter((w) =>
      (activeCat === 'all' || w.work_categories?.slug === activeCat) &&
      workMatchesQuery(w, query, serviceName));
  }, [works, activeCat, query]);

  const { grid, reels } = useMemo(() => splitByOrientation(filtered), [filtered]);
  const allVertical = grid.length === 0 && reels.length > 0;
  const isDefaultView = activeCat === 'all' && !query;
  const shelfInline = isDefaultView && reels.length > 0;

  useEffect(() => { setVisible(WORK_PAGE_SIZE); }, [activeCat, query]);

  const shownGrid = grid.slice(0, visible);
  const hasMore = grid.length > visible;

  // Load more when the sentinel nears the viewport.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) setVisible((v) => v + WORK_PAGE_SIZE);
    }, { rootMargin: '600px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore]);

  useEffect(() => {
    const update = () => {
      const node = stickyRef.current;
      if (node) setStuck(node.getBoundingClientRect().top <= parseFloat(getComputedStyle(node).top) + 1);
    };
    update(); window.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);

  const scrollChips = (dir: -1 | 1) => chipsRef.current?.scrollBy({ left: dir * 260, behavior: 'smooth' });

  const reelsShelf = (
    <section className="workpage-reels" aria-label="Reels">
      <h2 className="workpage-reels-title"><Clapperboard size={18} /> Reels</h2>
      <div className="workpage-reels-row">
        {reels.map((w) => <WorkCard key={w.id} work={w} vertical />)}
      </div>
    </section>
  );

  const loading = worksQuery.isPending;

  return (
    <div className="public-page workpage">
      <header className="workpage-head container-site">
        <h1>Our <em>work</em></h1>
        <p>Ad films, reels and visuals we made with AI. No shoot days.</p>
      </header>

      <div ref={stickyRef} className={`workpage-sticky${stuck ? ' is-stuck' : ''}`}>
        <div className="container-site">
          <div className="workpage-search" role="search">
            <Search size={18} aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              placeholder="Search videos, clients, services"
              value={input}
              onChange={(e) => onInput(e.target.value)}
              aria-label="Search our work"
              enterKeyHint="search"
            />
            {input && (
              <Button variant="ghost" type="button" className="workpage-clear" aria-label="Clear search" onClick={() => { setInput(''); setSearch({ q: '' }); searchRef.current?.focus(); }}>
                <X size={16} />
              </Button>
            )}
          </div>
          <div className="workpage-chips-wrap">
            <Button variant="ghost" type="button" className="workpage-chip-arrow" aria-label="Scroll categories left" onClick={() => scrollChips(-1)}><ChevronLeft size={16} /></Button>
            <div className="workpage-chips" ref={chipsRef}>
              <Button variant="ghost" className={activeCat === 'all' ? 'is-active' : ''} onClick={() => setSearch({ cat: '' })}>All</Button>
              {categories.map((c) => (
                <Button variant="ghost" key={c.id} className={activeCat === c.slug ? 'is-active' : ''} onClick={() => setSearch({ cat: c.slug })}>{c.name}</Button>
              ))}
            </div>
            <Button variant="ghost" type="button" className="workpage-chip-arrow" aria-label="Scroll categories right" onClick={() => scrollChips(1)}><ChevronRight size={16} /></Button>
          </div>
        </div>
      </div>

      <main className="container-site workpage-results">
        {query && !loading && <p className="workpage-count">{filtered.length} result{filtered.length === 1 ? '' : 's'} for &ldquo;{query}&rdquo;</p>}

        {loading ? (
          <div className="workpage-grid"><SkeletonCards count={8} /></div>
        ) : filtered.length === 0 ? (
          <div className="workpage-empty">
            <h2>{query ? `No videos match "${query}"` : 'No videos here yet'}</h2>
            <p>Try one of these categories instead.</p>
            <div className="workpage-chips workpage-empty-chips">
              <Button variant="ghost" onClick={() => { setInput(''); setSearch({ cat: '', q: '' }); }}>All</Button>
              {categories.map((c) => <Button variant="ghost" key={c.id} onClick={() => { setInput(''); setSearch({ cat: c.slug, q: '' }); }}>{c.name}</Button>)}
            </div>
            {query && <Button variant="ghost" className="workpage-clear-btn" onClick={() => { setInput(''); setSearch({ q: '' }); }}>Clear search</Button>}
          </div>
        ) : allVertical ? (
          <div className="workpage-grid is-vertical-grid">
            {reels.map((w) => <WorkCard key={w.id} work={w} vertical />)}
          </div>
        ) : (
          <>
            {!shelfInline && reels.length > 0 && reelsShelf}
            <div className="workpage-grid">
              {(shelfInline ? shownGrid.slice(0, REELS_SHELF_AFTER) : shownGrid).map((w) => (
                <WorkCard key={w.id} work={w} />
              ))}
            </div>
            {shelfInline && reelsShelf}
            {shelfInline && shownGrid.length > REELS_SHELF_AFTER && (
              <div className="workpage-grid">
                {shownGrid.slice(REELS_SHELF_AFTER).map((w) => (
                  <WorkCard key={w.id} work={w} />
                ))}
              </div>
            )}
            {hasMore && (
              <div className="workpage-more" ref={sentinelRef}>
                <Button variant="ghost" className="workpage-clear-btn" onClick={() => setVisible((v) => v + WORK_PAGE_SIZE)}>Load more</Button>
              </div>
            )}
          </>
        )}
      </main>

      <CtaStrip title="Want one of these for your brand?" />
    </div>
  );
}
