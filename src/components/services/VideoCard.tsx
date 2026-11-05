import { useState } from 'react';
import { videos } from '@/content/videos';
import { VimeoPlayer, type VideoAspect } from './VimeoPlayer';
import { ServiceReveal } from './ServiceMotion';

export function VideoCard({ videoKey, title, tag, aspect = '16/9', className }: { videoKey: string; title?: string; tag?: string; aspect?: VideoAspect; className?: string }) {
  const [hover, setHover] = useState(false);
  return <ServiceReveal {...(className ? { className } : {})}><figure className="service-foundation service-video-card" onPointerEnter={event => { if (event.pointerType === 'mouse' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) setHover(true); }} onPointerLeave={() => setHover(false)}>
    <VimeoPlayer videoKey={videoKey} mode="player" aspect={aspect} hoverPreview previewActive={hover} />
    <figcaption><h3>{title ?? videos[videoKey]?.title ?? 'Service video'}</h3>{tag && <p>{tag}</p>}</figcaption>
  </figure></ServiceReveal>;
}
