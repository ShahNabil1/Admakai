import { describe, expect, it } from 'vitest';
import { compactCount, publicTotal, shouldCountView, validateComment } from './work-feedback';

describe('work feedback rules', () => {
  it('public count is starting number plus real views', () => {
    expect(publicTotal(130000, 42)).toBe(130042);
  });
  it('a visitor is counted again only after 24 hours', () => {
    const t = Date.UTC(2026, 10, 8);
    expect(shouldCountView(null, t)).toBe(true);
    expect(shouldCountView(t, t + 23 * 3600_000)).toBe(false);
    expect(shouldCountView(t, t + 24 * 3600_000)).toBe(true);
  });
  it('comments must be 1 to 1000 characters', () => {
    expect(validateComment('   ')).not.toBeNull();
    expect(validateComment('a'.repeat(1001))).not.toBeNull();
    expect(validateComment('Nice work')).toBeNull();
  });
  it('formats counts compactly', () => {
    expect(compactCount(130042)).toBe('130K');
    expect(compactCount(1250)).toBe('1.2K');
  });
});
