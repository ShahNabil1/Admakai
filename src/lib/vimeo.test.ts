import { describe, expect, it } from 'vitest';
import { parseVimeoId, closestAspect, formatDuration } from './vimeo';

describe('parseVimeoId', () => {
  it.each([
    ['https://vimeo.com/1205218185', '1205218185'],
    ['https://vimeo.com/1205218185/abc123def', '1205218185'],
    ['https://player.vimeo.com/video/1205218185?autoplay=1', '1205218185'],
    ['1205218185', '1205218185'],
    ['  1205218185  ', '1205218185'],
  ])('parses %s', (input, expected) => {
    expect(parseVimeoId(input)).toBe(expected);
  });
  it.each(['', 'https://vimeo.com/', 'https://youtube.com/watch?v=123', 'abc', 'https://vimeo.com/channels/staffpicks'])('rejects %s', input => {
    expect(parseVimeoId(input)).toBeNull();
  });
});

describe('closestAspect', () => {
  it.each([
    [1920, 1080, '16:9'],
    [1080, 1920, '9:16'],
    [1080, 1080, '1:1'],
    [1080, 1350, '4:5'],
    [0, 0, '16:9'],
  ] as const)('maps %sx%s to %s', (width, height, expected) => {
    expect(closestAspect(width, height)).toBe(expected);
  });
});

describe('formatDuration', () => {
  it.each([
    [0, '0:00'],
    [5, '0:05'],
    [65, '1:05'],
    [600, '10:00'],
    [null, '0:00'],
  ] as const)('formats %s as %s', (sec, expected) => {
    expect(formatDuration(sec)).toBe(expected);
  });
});
