import type { Work } from '@/types/work';
import { supabase } from './supabase';
import { getVimeoMeta } from './vimeo';

export async function fetchMissingThumbnails(works: Pick<Work, 'id' | 'vimeo_id' | 'thumbnail_url'>[], onProgress?: (done: number, total: number) => void) {
  const missing = works.filter(work => !work.thumbnail_url?.trim());
  let saved = 0;
  let failed = 0;
  for (const [index, work] of missing.entries()) {
    try {
      const meta = await getVimeoMeta(work.vimeo_id);
      if (!meta?.thumbnailUrl || !/^https:\/\//.test(meta.thumbnailUrl)) { failed++; continue; }
      const update = supabase.from('works').update({ thumbnail_url: meta.thumbnailUrl }).eq('id', work.id);
      const guarded = work.thumbnail_url === null ? update.is('thumbnail_url', null) : update.eq('thumbnail_url', work.thumbnail_url);
      const { data, error } = await guarded.select('id');
      if (error || !data?.length) failed++; else saved++;
    } catch { failed++; }
    finally { onProgress?.(index + 1, missing.length); }
  }
  return { saved, failed, total: missing.length };
}