import { describe, expect, it } from 'vitest';
import { deliverablePath, formatTimecode, revisionsLeft } from './timecode';

describe('timecode', () => {
  it('formats minutes, seconds and hundredths', () => {
    expect(formatTimecode(83_450)).toBe('01:23.45');
  });
  it('adds hours for long videos', () => {
    expect(formatTimecode(3_723_000)).toBe('1:02:03.00');
  });
  it('never goes negative', () => {
    expect(formatTimecode(-50)).toBe('00:00.00');
  });
  it('two revisions allowed: none left after two', () => {
    expect(revisionsLeft(2, 0)).toBe(2);
    expect(revisionsLeft(2, 2)).toBe(0);
    expect(revisionsLeft(2, 5)).toBe(0);
  });
  it('stores files under the project folder', () => {
    expect(deliverablePath('p1', 'My Cut v2.mp4', 5)).toBe('p1/5-My-Cut-v2.mp4');
  });
});
