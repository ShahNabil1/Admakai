import type { ServiceVideo } from '@/content/videos';
export const isReadyVideo = (video?: ServiceVideo): video is ServiceVideo => Boolean(video && /^[1-9]\d*$/.test(video.id));
export function vimeoUrl(video: ServiceVideo, mode: 'background' | 'player', backgroundMode: boolean, autoplay = true) {
  const params = new URLSearchParams();
  if (video.hash) params.set('h', video.hash);
  if (mode === 'background' && backgroundMode) {
    params.set('background', '1');
    params.set('autoplay', '1'); params.set('loop', '1'); params.set('muted', '1');
  } else {
    params.set('autoplay', '1'); params.set('muted', mode === 'background' ? '1' : '0');
    if (mode === 'background') {
      params.set('loop', '1'); params.set('controls', '0');
      params.set('title', '0'); params.set('byline', '0'); params.set('portrait', '0');
    }
    params.set('playsinline', '1');
  }
  if (!autoplay) params.set('autoplay', '0');
  params.set('dnt', '1');
  return `https://player.vimeo.com/video/${video.id}?${params}`;
}
export function quizResult(guess: 'A' | 'B', answer: 'A' | 'B') {
  return guess === answer
    ? `Right, clip ${answer} was made with AI. Now picture what your product's ad could look like.`
    : `Not quite. Clip ${answer} was made with AI, and clip ${answer === 'A' ? 'B' : 'A'} is real phone footage.`;
}
