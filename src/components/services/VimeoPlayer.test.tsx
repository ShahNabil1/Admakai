import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { videos } from '@/content/videos';
import { VimeoPlayer } from './VimeoPlayer';

const sdk = vi.hoisted(() => ({ play: vi.fn().mockResolvedValue(undefined), pause: vi.fn().mockResolvedValue(undefined), unload: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@vimeo/player', () => ({ default: class {
  ready = () => Promise.resolve(); play = sdk.play; pause = sdk.pause; unload = sdk.unload;
  on = vi.fn(); off = vi.fn();
} }));
let observers: { callback: IntersectionObserverCallback; options?: IntersectionObserverInit | undefined }[] = [];
function intersect(index: number, visible: boolean) {
  const observer = observers[index];
  if (observer) act(() => observer.callback([{ isIntersecting: visible } as IntersectionObserverEntry], {} as IntersectionObserver));
}
beforeEach(() => {
  vi.clearAllMocks(); observers = [];
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) { observers.push({ callback, options }); }
    observe() {} disconnect() {}
  });
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation(() => ({ matches: false, addEventListener() {}, removeEventListener() {} })));
  videos['testReal'] = { id: '123456', poster: 'https://example.com/poster.jpg', title: 'Test real video' };
});
afterEach(() => { cleanup(); delete videos['testReal']; vi.unstubAllGlobals(); });

describe('Vimeo lifecycle', () => {
  it('loads no iframe or poster before the 300px observer and pauses offscreen', async () => {
    const { container } = render(<VimeoPlayer videoKey="testReal" mode="background" />);
    expect(container.querySelector('iframe')).toBeNull(); expect(container.querySelector('img')).toBeNull();
    expect(observers[0]?.options?.rootMargin).toBe('300px');
    intersect(0, true);
    await waitFor(() => expect(sdk.pause).toHaveBeenCalled());
    expect(container.querySelector('iframe')?.src).toContain('autoplay=0');
    intersect(1, true); await waitFor(() => expect(sdk.play).toHaveBeenCalled());
    const pauseCount = sdk.pause.mock.calls.length;
    intersect(1, false); await waitFor(() => expect(sdk.pause.mock.calls.length).toBeGreaterThan(pauseCount));
  });
  it('never autoplays with reduced motion but allows explicit lightbox playback', async () => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: true, addEventListener() {}, removeEventListener() {} } as unknown as MediaQueryList);
    const { container } = render(<VimeoPlayer videoKey="testReal" mode="background" />);
    intersect(0, true); intersect(1, true);
    expect(container.querySelector('iframe')).toBeNull(); expect(sdk.play).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Play Test real video' }));
    expect(screen.getByRole('dialog').querySelector('iframe')?.src).toContain('muted=0');
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
  it('creates and removes the player iframe on click and close only', async () => {
    const { container } = render(<VimeoPlayer videoKey="testReal" mode="player" />);
    expect(container.querySelector('iframe')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Play Test real video' }));
    expect(screen.getByRole('dialog').querySelector('iframe')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Close video' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
  it('does not request Vimeo for placeholder IDs', () => {
    const { container } = render(<VimeoPlayer videoKey="servicesHero" mode="background" />);
    intersect(0, true); intersect(1, true);
    expect(container.querySelector('iframe')).toBeNull(); expect(sdk.play).not.toHaveBeenCalled();
  });
  it('supports supplied portfolio metadata without changing the shared registry', () => {
    const { container } = render(<VimeoPlayer videoKey="portfolio" mode="inline" videoData={{ id: '987654', title: 'Supplied project', poster: '' }} />);
    expect(container.querySelector('iframe')?.src).toContain('/video/987654?');
    expect(container.querySelector('iframe')?.src).toContain('muted=0');
    expect(videos['portfolio']).toBeUndefined();
  });
  it('does not start an inactive portfolio preview even when visible', () => {
    const { container } = render(<VimeoPlayer videoKey="testReal" mode="background" previewActive={false} />);
    intersect(0, true); intersect(1, true);
    expect(container.querySelector('iframe')).toBeNull(); expect(sdk.play).not.toHaveBeenCalled();
  });
  it('uses the supplied gallery callback instead of opening a nested lightbox', () => {
    const onPlay = vi.fn();
    render(<VimeoPlayer videoKey="testReal" mode="background" onPlay={onPlay} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play Test real video' }));
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});