import { useState } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMotionPreference } from '@/hooks/use-motion-preference';
import { previewLoopTime, resolveInternshipVideo, type InternshipVideoSettings } from '@/lib/internship-video';

export function InternshipVideo({ settings, compact = false }: { settings: InternshipVideoSettings; compact?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const video = resolveInternshipVideo(settings.internship_video_url);
  if (!video) return null;
  const title = settings.internship_video_title?.trim() || 'Hear it from our AI Director';
  return <div className={`career-video${compact ? ' career-video-compact' : ''}`}>
    {playing ? video.kind === 'mp4' ? <video src={video.src} controls playsInline aria-label={title}
      ref={node => { if (node) void node.play().catch(() => setFailed(true)); }}
      onError={() => setFailed(true)} /> : <iframe src={video.src} title={title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen /> : <>
      {settings.internship_video_poster_url && !posterFailed && <img className="career-video-poster" src={settings.internship_video_poster_url} alt="" onError={() => setPosterFailed(true)} />}
      <div className="career-video-shade" />
      <Button variant="ghost" size="icon" className="career-video-play" aria-label={`Play ${title}`} onClick={() => { setFailed(false); setPlaying(true); }}><Play fill="currentColor" /></Button>
      <div className="career-video-caption"><h3>{title}</h3><p>2 min · Everything about the program, in his own words</p></div>
    </>}
    {failed && <div className="career-video-error" role="alert">Video could not play. <Button variant="link" onClick={() => { setPlaying(false); setFailed(false); }}>Try again</Button></div>}
  </div>;
}

export function InternshipHeroPreview({ settings }: { settings: InternshipVideoSettings }) {
  const reduce = useMotionPreference();
  const [failed, setFailed] = useState(false);
  const video = resolveInternshipVideo(settings.internship_video_url);
  if (reduce !== false || failed || video?.kind !== 'mp4') return null;
  return <div className="career-hero-preview"><video src={video.src} muted autoPlay loop playsInline tabIndex={-1} aria-hidden="true"
    onError={() => setFailed(true)} onTimeUpdate={event => { const node = event.currentTarget; const next = previewLoopTime(node.currentTime); if (next !== node.currentTime) node.currentTime = next; }} />
    <div className="career-hero-preview-shade" /></div>;
}