import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { backgroundMode, videos } from '@/content/videos';
import { cn } from '@/lib/utils';
import { isReadyVideo, vimeoUrl } from './video-rules';
import './services.css';

export type VideoAspect = '16/9' | '9/16' | '1/1' | '4/5';
export interface VimeoPlayerProps {
  videoKey: string;
  mode: 'background' | 'player';
  aspect?: VideoAspect;
  className?: string;
  /** VideoCard previews only autoplay while hovered. */
  previewActive?: boolean;
  hoverPreview?: boolean;
}
const aspectClasses: Record<VideoAspect, string> = {
  '16/9': 'service-video--wide', '9/16': 'service-video--portrait',
  '1/1': 'service-video--square', '4/5': 'service-video--social',
};

export function VimeoPlayer({ videoKey, mode, aspect = '16/9', className, previewActive = true, hoverPreview = false }: VimeoPlayerProps) {
  const video = videos[videoKey];
  const ready = isReadyVideo(video);
  const title = video?.title ?? 'Service video';
  const frame = useRef<HTMLDivElement>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const player = useRef<import('@vimeo/player').default | null>(null);
  const shouldPlay = useRef(false);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reduce, setReduce] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const autoplay = (mode === 'background' || hoverPreview) && reduce === false && previewActive && !open;
  shouldPlay.current = autoplay && visible;

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduce(preference.matches);
    update(); preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const preload = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) setNear(true);
    }, { rootMargin: '300px' });
    const visibility = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)));
    preload.observe(element); visibility.observe(element);
    return () => { preload.disconnect(); visibility.disconnect(); };
  }, []);

  const mountBackground = ready && near && autoplay && !failed;
  useEffect(() => {
    const element = iframe.current;
    if (!mountBackground || !element) return;
    let disposed = false;
    let instance: import('@vimeo/player').default | null = null;
    void import('@vimeo/player').then(({ default: Player }) => {
      if (disposed) return;
      instance = new Player(element);
      player.current = instance;
      instance.on('error', () => { if (!disposed) setFailed(true); });
      void instance.ready().then(() => {
        if (disposed || !instance) return;
        // A 300px preload must not start playing before it is actually visible.
        return shouldPlay.current ? instance.play() : instance.pause();
      }).catch(() => { if (!disposed) setFailed(true); });
    }).catch(() => { if (!disposed) setFailed(true); });
    return () => {
      disposed = true;
      player.current = null;
      // React owns the iframe; unload preserves that DOM node until React removes it.
      if (instance) { instance.off('error'); void instance.unload().catch(() => {}); }
    };
  }, [mountBackground, videoKey]);
  useEffect(() => {
    const instance = player.current;
    if (instance) void (autoplay && visible ? instance.play() : instance.pause()).catch(() => {});
  }, [autoplay, visible]);

  const placeholder = <div className="service-video-placeholder"><span>{title}</span><p>{failed ? 'Video unavailable' : 'Video coming soon'}</p></div>;
  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <div ref={frame} className={cn('service-foundation service-video', aspectClasses[aspect], className)}>
      {ready ? <>
        {near && video.poster && <img src={video.poster} alt="" loading="lazy" />}
        {mountBackground && <iframe ref={iframe} src={vimeoUrl(video, 'background', backgroundMode, false)} title={title} allow="autoplay; fullscreen; picture-in-picture" tabIndex={-1} />}
        {failed && placeholder}
        {(mode === 'player' || reduce === true) && <Dialog.Trigger asChild><Button variant="ghost" className="service-play" aria-label={`Play ${title}`}><span className="service-play-symbol"><Play aria-hidden="true" /></span></Button></Dialog.Trigger>}
      </> : placeholder}
    </div>
    {ready && <Dialog.Portal>
      <Dialog.Overlay className="service-lightbox-overlay" />
      <Dialog.Content className="service-foundation service-lightbox" aria-describedby={undefined} data-lenis-prevent>
        <div className="service-lightbox-header">
          <Dialog.Title className="service-lightbox-title">{title}</Dialog.Title>
          <Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Close video" title="Close video"><X aria-hidden="true" /></Button></Dialog.Close>
        </div>
        <div className={cn('service-video', aspectClasses[aspect])}>
          {open && <iframe src={vimeoUrl(video, 'player', backgroundMode)} title={title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />}
        </div>
      </Dialog.Content>
    </Dialog.Portal>}
  </Dialog.Root>;
}
