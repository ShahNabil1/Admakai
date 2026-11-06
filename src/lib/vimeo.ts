import type { Work, WorkAspect } from '@/types/work';

const META_CACHE_KEY = 'admakai_vimeo_meta_v1';
const META_CACHE_MS = 7 * 24 * 60 * 60 * 1000;

export type VimeoMeta = {
  title: string;
  thumbnailUrl: string;
  durationSec: number;
  width: number;
  height: number;
  aspect: WorkAspect;
};

export function parseVimeoId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (/^\d+$/.test(value)) return value;
  const player = value.match(/player\.vimeo\.com\/video\/(\d+)/);
  if (player) return player[1] ?? null;
  const plain = value.match(/(?:^|\/\/)vimeo\.com\/(\d+)(?:\/[\w-]+)?(?:[?#].*)?$/);
  if (plain) return plain[1] ?? null;
  return null;
}

export function closestAspect(width: number, height: number): WorkAspect {
  if (!(width > 0) || !(height > 0)) return '16:9';
  const ratio = Math.log(width / height);
  const candidates: [WorkAspect, number][] = [['16:9', 16 / 9], ['9:16', 9 / 16], ['1:1', 1], ['4:5', 4 / 5]];
  let best: WorkAspect = '16:9';
  let bestDistance = Infinity;
  for (const [aspect, value] of candidates) {
    const distance = Math.abs(ratio - Math.log(value));
    if (distance < bestDistance) { bestDistance = distance; best = aspect; }
  }
  return best;
}

export function formatDuration(sec: number | null | undefined): string {
  if (!sec || sec <= 0) return '0:00';
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

type CacheEntry = { at: number; meta: VimeoMeta };

function readCache(): Record<string, CacheEntry> {
  try {
    if (typeof window === 'undefined') return {};
    const raw = window.localStorage.getItem(META_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CacheEntry>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, CacheEntry>) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(META_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // storage full or blocked: skip caching, the fetch result still returns
  }
}

export async function getVimeoMeta(id: string): Promise<VimeoMeta | null> {
  const cache = readCache();
  const cached = cache[id];
  if (cached && Date.now() - cached.at < META_CACHE_MS) return cached.meta;
  try {
    const response = await fetch(`https://vimeo.com/api/oembed.json?url=https%3A//vimeo.com/${id}&width=1280`, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return null;
    const data = await response.json() as { title?: string; thumbnail_url?: string; duration?: number; width?: number; height?: number };
    const width = Number(data.width) || 0;
    const height = Number(data.height) || 0;
    const meta: VimeoMeta = {
      title: data.title ?? '',
      thumbnailUrl: data.thumbnail_url ?? '',
      durationSec: Number(data.duration) || 0,
      width,
      height,
      aspect: closestAspect(width, height),
    };
    cache[id] = { at: Date.now(), meta };
    writeCache(cache);
    return meta;
  } catch {
    return null;
  }
}

export async function getThumbnail(work: Pick<Work, 'vimeo_id' | 'thumbnail_url'>): Promise<string> {
  if (work.thumbnail_url) return work.thumbnail_url;
  const cached = readCache()[work.vimeo_id];
  if (cached && Date.now() - cached.at < META_CACHE_MS) return cached.meta.thumbnailUrl;
  const meta = await getVimeoMeta(work.vimeo_id);
  return meta?.thumbnailUrl ?? '';
}
