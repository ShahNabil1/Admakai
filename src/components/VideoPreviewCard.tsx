import { useEffect, useId, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WorkWithLinks } from '@/lib/works';
import { formatDuration, getVimeoMeta } from '@/lib/vimeo';
import { getPreviewController } from '@/lib/video-preview-controller';
import { PREVIEW_DELAY_MS, previewAllowed } from '@/lib/video-preview-rules';
import './VideoPreviewCard.css';

/** Shared thumbnail and globally coordinated muted preview, with an optional service lightbox action. */
export function VideoPreviewCard({ work, className = '', vertical = false, onOpen, disabled = false }: {
  work: WorkWithLinks; className?: string; vertical?: boolean; onOpen?: () => void; disabled?: boolean;
}) {
  const id = useId();
  const element = useRef<HTMLAnchorElement & HTMLButtonElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const player = useRef<import('@vimeo/player').default | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);
  const [enabled, setEnabled] = useState(false);
  const [fine, setFine] = useState(false);
  const [active, setActive] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [thumb, setThumb] = useState(work.thumbnail_url ?? '');
  const [loaded, setLoaded] = useState(false);
  const recovered = useRef(false);
  const generation = useRef(0);

  useEffect(() => {
    generation.current += 1;
    const current = generation.current;
    setThumb(work.thumbnail_url ?? ''); setLoaded(false); recovered.current = false;
    if (!work.thumbnail_url) {
      recovered.current = true;
      void getVimeoMeta(work.vimeo_id).then(meta => { if (generation.current === current) setThumb(meta?.thumbnailUrl ?? ''); });
    }
    return () => { generation.current += 1; };
  }, [work.vimeo_id, work.thumbnail_url]);
  const recover = () => {
    setLoaded(false);
    if (recovered.current) { setThumb(''); return; }
    recovered.current = true;
    const current = generation.current;
    setThumb('');
    void getVimeoMeta(work.vimeo_id).then(meta => { if (generation.current === current) setThumb(meta?.thumbnailUrl ?? ''); });
  };

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = window.matchMedia('(pointer: fine)');
    const connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }).connection;
    const update = () => { setEnabled(previewAllowed(motion.matches, Boolean(connection?.saveData)) && !disabled); setFine(pointer.matches); };
    update(); motion.addEventListener('change', update); pointer.addEventListener('change', update); connection?.addEventListener('change', update);
    return () => { motion.removeEventListener('change', update); pointer.removeEventListener('change', update); connection?.removeEventListener('change', update); };
  }, [disabled]);
  useEffect(() => {
    const node = element.current;
    if (!enabled || !node) { setActive(false); setMounted(false); return; }
    const controller = getPreviewController();
    const entry = { element: node, ratio: 0, coarse: !fine };
    const unregister = controller.register(id, entry);
    const sync = () => {
      const isActive = controller.snapshot.active === id;
      activeRef.current = isActive;
      if (!isActive) { setPlaying(false); void player.current?.pause().catch(() => {}); }
      setActive(isActive); setMounted(controller.snapshot.retained.includes(id));
    };
    controller.listeners.add(sync); sync();
    const observer = new IntersectionObserver(([event]) => {
      entry.ratio = event?.intersectionRatio ?? 0;
      if (!fine) controller.choose();
      else if (!event?.isIntersecting && controller.snapshot.active === id) controller.setActive(null);
    }, { threshold: [0, .7, 1] });
    observer.observe(node);
    return () => { observer.disconnect(); controller.listeners.delete(sync); unregister(); activeRef.current = false; if (timer.current) clearTimeout(timer.current); };
  }, [enabled, fine, id]);

  useEffect(() => {
    if (!mounted || !iframe.current) return;
    let disposed = false;
    let instance: import('@vimeo/player').default | undefined;
    const frame = iframe.current;
    void import('@vimeo/player').then(({ default: Player }) => {
      if (disposed) return;
      instance = new Player(frame); player.current = instance;
      instance.on('playing', () => {
        if (activeRef.current) setPlaying(true);
        else void instance?.pause().catch(() => {});
      });
      instance.on('timeupdate', (event: { percent: number }) => { if (activeRef.current) setProgress(Math.max(0, Math.min(1, event.percent))); });
      instance.on('error', () => setPlaying(false));
      void instance.ready().then(async () => {
        if (disposed || !instance) return;
        await instance.setMuted(true);
        if (activeRef.current) await instance.play(); else await instance.pause();
      }).catch(() => setPlaying(false));
    }).catch(() => setPlaying(false));
    return () => { disposed = true; player.current = null; void instance?.destroy().catch(() => {}); };
  }, [mounted, work.vimeo_id]);
  useEffect(() => {
    if (!active) { setPlaying(false); void player.current?.pause().catch(() => {}); }
    else if (player.current) void player.current.setMuted(true).then(() => activeRef.current ? player.current?.play() : undefined).catch(() => setPlaying(false));
  }, [active]);

  const enter = () => {
    if (!enabled || !fine) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => getPreviewController().setActive(id), PREVIEW_DELAY_MS);
  };
  const leave = () => {
    if (timer.current) clearTimeout(timer.current);
    const controller = getPreviewController();
    if (fine && controller.snapshot.active === id) controller.setActive(null);
  };
  const content = <>
    {mounted && <iframe ref={iframe} title={`${work.title} preview`} src={`https://player.vimeo.com/video/${work.vimeo_id}?background=1&muted=1&loop=1&autopause=0&dnt=1`} allow="autoplay; fullscreen" tabIndex={-1} />}
    <span className="video-preview-poster">
      <span className="video-preview-fallback"><Play size={24} aria-hidden="true"/><span>{work.title}</span></span>
      {thumb && <>{!vertical && work.aspect !== '16:9' && <img className="video-preview-blur" src={thumb} alt="" aria-hidden="true"/>}<img className="video-preview-image" src={thumb} alt="" loading="lazy" onLoad={() => setLoaded(true)} onError={recover}/></>}
    </span>
    {work.duration_sec ? <span className="video-preview-duration">{formatDuration(work.duration_sec)}</span> : null}
    {playing && active && <><span className="video-preview-playing"><i/>Playing</span><span className="video-preview-progress" style={{ transform: `scaleX(${progress})` }}/></>}
  </>;
  const props = { className: `video-preview ${!vertical && work.aspect !== '16:9' ? 'is-contained' : ''} ${className}`, 'aria-label': work.title, 'data-playing': playing && active, 'data-loaded': loaded, onPointerEnter: enter, onPointerLeave: leave };
  return onOpen ? <Button variant="ghost" ref={element} {...props} onClick={onOpen}>{content}</Button> : <Link ref={element} to="/work/$slug" params={{ slug: work.slug }} {...props}>{content}</Link>;
}