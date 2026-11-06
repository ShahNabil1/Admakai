import type { WorkWithLinks } from './works';

/** Every typed word must appear somewhere in the work's searchable text. */
export function workMatchesQuery(work: WorkWithLinks, query: string, serviceName: (slug: string) => string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = [
    work.title,
    work.client_name,
    work.work_categories?.name,
    work.industry,
    work.short_description,
    ...(work.tags ?? []),
    ...(work.work_services ?? []).map((link) => serviceName(link.service_slug)),
  ].filter(Boolean).join(' ').toLowerCase();
  return words.every((word) => haystack.includes(word));
}

export type WorkSplit = { grid: WorkWithLinks[]; reels: WorkWithLinks[] };

/** Vertical 9:16 works go to the reels shelf; everything else goes to the main grid. */
export function splitByOrientation(works: WorkWithLinks[]): WorkSplit {
  const grid: WorkWithLinks[] = [];
  const reels: WorkWithLinks[] = [];
  for (const work of works) (work.aspect === '9:16' ? reels : grid).push(work);
  return { grid, reels };
}

export const WORK_PAGE_SIZE = 12;
/** On the unfiltered view the reels shelf sits after the second grid row. */
export const REELS_SHELF_AFTER = 8;

/**
 * Up next ranking: same category first, then works sharing a service,
 * then featured ones. The current work is never included.
 */
export function rankUpNext(current: WorkWithLinks, all: WorkWithLinks[], limit = 10): WorkWithLinks[] {
  const currentServices = new Set((current.work_services ?? []).map((link) => link.service_slug));
  const score = (work: WorkWithLinks) => {
    let value = 0;
    if (current.category_id && work.category_id === current.category_id) value += 4;
    if ((work.work_services ?? []).some((link) => currentServices.has(link.service_slug))) value += 2;
    if (work.featured) value += 1;
    return value;
  };
  return all
    .filter((work) => work.id !== current.id)
    .map((work) => ({ work, value: score(work) }))
    .sort((a, b) => b.value - a.value || a.work.sort_order - b.work.sort_order)
    .slice(0, limit)
    .map((entry) => entry.work);
}

/** ISO 8601 duration for JSON-LD, e.g. PT1M21S. */
export function isoDuration(sec: number | null | undefined): string | undefined {
  if (!sec || sec <= 0) return undefined;
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);
  return `PT${minutes}M${seconds}S`;
}
