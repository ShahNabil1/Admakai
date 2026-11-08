import { describe, expect, it, vi } from 'vitest';
import { createHiringMediaCache, hiringMediaPath, HIRING_MEDIA_BUCKET, HIRING_MEDIA_TTL } from './hiring-media';
describe('Hiring image rules', () => {
  it('uses the private hiring-media bucket', () => { expect(HIRING_MEDIA_BUCKET).toBe('hiring-media'); });
  it('signs URLs for exactly one hour', async () => {
    const sign = vi.fn(async () => 'signed-url');
    await createHiringMediaCache(sign)('owner/cover.png');
    expect(sign).toHaveBeenCalledWith('owner/cover.png', 3600);
    expect(HIRING_MEDIA_TTL).toBe(3600);
  });
  it('caches and deduplicates URLs in memory while valid', async () => {
    const sign = vi.fn(async () => 'signed-url');
    const cached = createHiringMediaCache(sign);
    await Promise.all([cached('cover.png'), cached('cover.png')]);
    expect(sign).toHaveBeenCalledTimes(1);
  });
  it('renews a signed URL before one hour expires', async () => {
    let now = 0;
    const sign = vi.fn(async () => 'signed-url');
    const cached = createHiringMediaCache(sign, () => now);
    await cached('cover.png');
    now = 3600000;
    await cached('cover.png');
    expect(sign).toHaveBeenCalledTimes(2);
  });
  it('never retains failed signing attempts', async () => {
    const sign = vi.fn().mockRejectedValueOnce(new Error('unavailable')).mockResolvedValue('signed-url');
    const cached = createHiringMediaCache(sign);
    await expect(cached('cover.png')).rejects.toThrow('unavailable');
    await expect(cached('cover.png')).resolves.toBe('signed-url');
    expect(sign).toHaveBeenCalledTimes(2);
  });
  it('persists paths and extracts them from older signed media links', () => {
    expect(hiringMediaPath('owner/cover.png')).toBe('owner/cover.png');
    expect(hiringMediaPath('https://example.supabase.co/storage/v1/object/sign/hiring-media/owner/cover.png?token=expired')).toBe('owner/cover.png');
    expect(hiringMediaPath('https://example.com/poster.jpg')).toBeNull();
  });
});