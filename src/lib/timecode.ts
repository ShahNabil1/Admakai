// Browser-safe helpers for timecoded video review.
export function formatTimecode(ms: number): string {
  const safe = Math.max(0, Math.floor(ms));
  const total = Math.floor(safe / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const frac = Math.floor((safe % 1000) / 10);
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  const ff = String(frac).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}.${ff}` : `${mm}:${ss}.${ff}`;
}

export const DELIVERABLE_MIME = ['video/mp4', 'video/quicktime', 'video/webm', 'image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
export const DELIVERABLE_MAX_BYTES = 2 * 1024 * 1024 * 1024;

/** Revisions used for a deliverable title against the project's limit. */
export function revisionsLeft(limit: number, used: number): number {
  return Math.max(0, limit - used);
}

export function deliverablePath(projectId: string, fileName: string, now = Date.now()): string {
  const clean = fileName.normalize('NFKD').replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').slice(-80) || 'file';
  return `${projectId}/${now}-${clean}`;
}
