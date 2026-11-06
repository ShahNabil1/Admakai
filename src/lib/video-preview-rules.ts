export const PREVIEW_DELAY_MS = 150;
export const MAX_PAUSED_PREVIEWS = 3;
export const MIN_PREVIEW_VISIBILITY = 0.7;
export function previewAllowed(reducedMotion: boolean, saveData: boolean) { return !reducedMotion && !saveData; }
export function closestPreview(candidates: { id: string; ratio: number; centre: number }[], viewportCentre: number) {
  return candidates.filter(item => item.ratio >= MIN_PREVIEW_VISIBILITY)
    .sort((a, b) => Math.abs(a.centre - viewportCentre) - Math.abs(b.centre - viewportCentre))[0]?.id ?? null;
}
export function retainedPreviews(previous: string[], active: string | null) {
  return active ? [active, ...previous.filter(id => id !== active)].slice(0, MAX_PAUSED_PREVIEWS + 1) : previous.slice(0, MAX_PAUSED_PREVIEWS);
}