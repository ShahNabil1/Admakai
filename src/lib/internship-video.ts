export type InternshipVideoSettings = {
  internship_video_url: string | null;
  internship_video_poster_url: string | null;
  internship_video_title: string | null;
};
export const emptyInternshipVideo: InternshipVideoSettings = {
  internship_video_url: null,
  internship_video_poster_url: null,
  internship_video_title: "Hear it from our AI Director",
};
export function resolveInternshipVideo(value: string | null | undefined) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (/\.mp4$/i.test(url.pathname)) return { kind: 'mp4' as const, src: url.href };
    if (['youtube.com', 'm.youtube.com', 'youtu.be', 'youtube-nocookie.com'].includes(host)) {
      const id = host === 'youtu.be' ? url.pathname.split('/')[1] : url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];
      if (!id || !/^[\w-]{11}$/.test(id)) return null;
      return { kind: 'youtube' as const, id, src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0` };
    }
    if (['vimeo.com', 'player.vimeo.com'].includes(host)) {
      const match = url.pathname.match(/\/(\d+)(?:\/([a-zA-Z0-9]+))?\/?$/);
      if (!match) return null;
      const hash = url.searchParams.get('h') || match[2];
      return { kind: 'vimeo' as const, src: `https://player.vimeo.com/video/${match[1]}?autoplay=1&muted=0${hash ? `&h=${encodeURIComponent(hash)}` : ''}` };
    }
    return null;
  } catch { return null; }
}
export function previewLoopTime(time: number) { return time >= 10 ? 0 : time; }
export function showInternshipVideo(jobType: string) { return jobType === 'internship'; }
export function youtubePoster(value: string | null | undefined, fallback = false) {
  const video = resolveInternshipVideo(value);
  return video?.kind === 'youtube' ? `https://i.ytimg.com/vi/${video.id}/${fallback ? 'hqdefault' : 'maxresdefault'}.jpg` : null;
}