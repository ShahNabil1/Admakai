import { describe, expect, it } from 'vitest';
import { previewLoopTime, resolveInternshipVideo, showInternshipVideo, youtubePoster } from './internship-video';
describe('Internship video rules', () => {
  it('hides the card for empty URLs', () => { expect(resolveInternshipVideo('')).toBeNull(); expect(resolveInternshipVideo(null)).toBeNull(); expect(resolveInternshipVideo('  ')).toBeNull(); });
  it('accepts YouTube watch and short links', () => { expect(resolveInternshipVideo('https://youtube.com/watch?v=dQw4w9WgXcQ')?.kind).toBe('youtube'); expect(resolveInternshipVideo('https://youtu.be/dQw4w9WgXcQ')?.src).toContain('/embed/dQw4w9WgXcQ'); });
  it('accepts Vimeo including private link hashes', () => { expect(resolveInternshipVideo('https://vimeo.com/123456789/abcdef')?.src).toContain('123456789?autoplay=1&muted=0&h=abcdef'); });
  it('accepts direct MP4 including query strings', () => { expect(resolveInternshipVideo('https://example.com/program.mp4?token=public')?.kind).toBe('mp4'); });
  it('rejects unsafe or unrelated URLs', () => { expect(resolveInternshipVideo('javascript:alert(1)')).toBeNull(); expect(resolveInternshipVideo('https://youtube.com.evil.invalid/watch?v=dQw4w9WgXcQ')).toBeNull(); });
  it('restarts the hero preview at ten seconds', () => { expect(previewLoopTime(9.9)).toBe(9.9); expect(previewLoopTime(10)).toBe(0); expect(previewLoopTime(10.5)).toBe(0); });
  it('shows job-detail video only for internship jobs', () => { expect(showInternshipVideo('internship')).toBe(true); expect(showInternshipVideo('full-time')).toBe(false); expect(showInternshipVideo('freelance')).toBe(false); });
  it('uses maxresdefault for YouTube without a poster', () => { expect(youtubePoster('https://youtu.be/dQw4w9WgXcQ')).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'); });
  it('falls back to hqdefault when maxresdefault is missing', () => { expect(youtubePoster('https://youtube.com/watch?v=dQw4w9WgXcQ', true)).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg'); });
  it('does not invent thumbnails for Vimeo or MP4', () => { expect(youtubePoster('https://vimeo.com/123456789')).toBeNull(); expect(youtubePoster('https://example.com/video.mp4')).toBeNull(); });
});