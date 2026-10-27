import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useTimedLogo } from './use-timed-logo';

describe('Touch logo activation', () => {
  afterEach(() => vi.useRealTimers());
  it('keeps a tapped logo active for exactly two seconds', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTimedLogo());
    act(() => result.current.activate('Akboria'));
    expect(result.current.active).toBe('Akboria');
    act(() => vi.advanceTimersByTime(1999));
    expect(result.current.active).toBe('Akboria');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.active).toBeNull();
  });
  it('restarts the two-second duration on another tap', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTimedLogo());
    act(() => result.current.activate('Akboria'));
    act(() => vi.advanceTimersByTime(1500));
    act(() => result.current.activate('Towbah'));
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.active).toBe('Towbah');
    act(() => vi.advanceTimersByTime(1500));
    expect(result.current.active).toBeNull();
  });
});