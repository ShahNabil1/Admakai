import { describe, expect, it } from 'vitest';
import { closestPreview, MAX_PAUSED_PREVIEWS, PREVIEW_DELAY_MS, previewAllowed, retainedPreviews } from './video-preview-rules';
describe('shared video preview rules', () => {
  it('waits 150ms on desktop', () => expect(PREVIEW_DELAY_MS).toBe(150));
  it('keeps at most three paused players', () => { expect(MAX_PAUSED_PREVIEWS).toBe(3); expect(retainedPreviews(['a','b','c','d'], null)).toEqual(['a','b','c']); expect(retainedPreviews(['a','b','c','d'], 'e')).toEqual(['e','a','b','c']); });
  it('only selects a card at least 70 percent visible closest to centre', () => expect(closestPreview([{id:'a',ratio:.69,centre:500},{id:'b',ratio:.7,centre:520},{id:'c',ratio:1,centre:650}],500)).toBe('b'));
  it('disables previews for reduced motion', () => expect(previewAllowed(true,false)).toBe(false));
  it('disables previews for data saving', () => expect(previewAllowed(false,true)).toBe(false));
});