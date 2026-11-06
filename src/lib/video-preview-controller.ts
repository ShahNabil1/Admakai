import { closestPreview, retainedPreviews } from './video-preview-rules';
type Entry = { element: HTMLElement; ratio: number; coarse: boolean };
type Snapshot = { active: string | null; retained: string[] };
class PreviewController {
  entries = new Map<string, Entry>();
  listeners = new Set<() => void>();
  snapshot: Snapshot = { active: null, retained: [] };
  frame = 0;
  setActive(id: string | null) {
    if (this.snapshot.active === id) return;
    this.snapshot = { active: id, retained: retainedPreviews(this.snapshot.retained, id) };
    this.listeners.forEach(listener => listener());
  }
  choose = () => {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      const candidates = [...this.entries].filter(([, entry]) => entry.coarse).map(([id, entry]) => {
        const rect = entry.element.getBoundingClientRect();
        const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
        const visibleWidth = Math.max(0, Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0));
        return { id, ratio: Math.min(entry.ratio, visibleHeight * visibleWidth / (rect.width * rect.height || 1)), centre: rect.top + rect.height / 2 };
      });
      if ([...this.entries.values()].some(entry => entry.coarse)) this.setActive(closestPreview(candidates, window.innerHeight / 2));
    });
  };
  register(id: string, entry: Entry) {
    if (!this.entries.size) {
      window.addEventListener('scroll', this.choose, { passive: true, capture: true });
      window.addEventListener('resize', this.choose, { passive: true });
    }
    this.entries.set(id, entry);
    return () => {
      this.entries.delete(id);
      if (this.snapshot.active === id) this.setActive(null);
      this.snapshot = { ...this.snapshot, retained: this.snapshot.retained.filter(key => key !== id) };
      this.listeners.forEach(listener => listener());
      if (!this.entries.size) {
        window.removeEventListener('scroll', this.choose, true);
        window.removeEventListener('resize', this.choose);
        cancelAnimationFrame(this.frame);
        this.frame = 0;
      }
    };
  }
}
let controller: PreviewController | undefined;
export function getPreviewController() { return controller ??= new PreviewController(); }