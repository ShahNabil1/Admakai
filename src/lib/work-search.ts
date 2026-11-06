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
