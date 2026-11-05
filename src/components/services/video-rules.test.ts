import { describe, expect, it } from 'vitest';
import { aiOrShotAnswer, videos } from '@/content/videos';
import { serviceSteps } from '@/content/service-process';
import { isReadyVideo, quizResult, vimeoUrl } from './video-rules';

describe('service video rules', () => {
  const video = { id: '123456', hash: 'privatehash', title: 'Demo', poster: '' };
  it('rejects the three configured placeholders and missing videos', () => {
    expect(Object.values(videos).map(isReadyVideo)).toEqual([false, false, false]);
    expect(isReadyVideo(undefined)).toBe(false);
    expect(isReadyVideo(video)).toBe(true);
  });
  it('places the unlisted hash first with muted looping background parameters', () => {
    const url = new URL(vimeoUrl(video, 'background', true));
    expect(url.search.startsWith('?h=privatehash&')).toBe(true);
    expect(Object.fromEntries(url.searchParams)).toEqual({ h: 'privatehash', background: '1', autoplay: '1', loop: '1', muted: '1', dnt: '1' });
  });
  it('uses the specified free-plan fallback', () => {
    const params = new URL(vimeoUrl(video, 'background', false)).searchParams;
    expect(Object.fromEntries(params)).toEqual({ h: 'privatehash', autoplay: '1', muted: '1', loop: '1', controls: '0', title: '0', byline: '0', portrait: '0', playsinline: '1', dnt: '1' });
  });
  it('only preloads without autoplay until visible', () => {
    expect(new URL(vimeoUrl(video, 'background', true, false)).searchParams.get('autoplay')).toBe('0');
  });
  it('explicit user playback autoplays with sound', () => {
    const params = new URL(vimeoUrl(video, 'player', true)).searchParams;
    expect(params.get('muted')).toBe('0'); expect(params.get('autoplay')).toBe('1'); expect(params.has('background')).toBe(false);
  });
  it('uses B as the configured answer and resolves both guesses', () => {
    expect(aiOrShotAnswer).toBe('B');
    expect(quizResult('B', aiOrShotAnswer).startsWith('Right, clip B')).toBe(true);
    expect(quizResult('A', aiOrShotAnswer)).toContain('clip A is real phone footage');
    expect(quizResult('B', 'A')).toContain('clip B is real phone footage');
  });
});
describe('approved payment process', () => {
  it('keeps seven stages with 50% advance at step 3 and remaining 50% at step 6', () => {
    expect(serviceSteps).toHaveLength(7);
    expect(serviceSteps[2]?.chip).toBe('50%');
    expect(serviceSteps[5]?.chip).toBe('50%');
    expect(serviceSteps.filter(step => step.chip)).toHaveLength(2);
  });
});