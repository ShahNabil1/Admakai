import { supabase } from './supabase';
import type { WorkWithLinks } from './works';
import type { WorkImportFile } from './work-schemas';

/** Admin list: every work, published or draft, with category and service links. */
export async function listAllWorks(): Promise<WorkWithLinks[]> {
  const { data, error } = await supabase
    .from('works')
    .select('*, work_categories(*), work_services(service_slug, position)')
    .order('sort_order');
  if (error) throw new Error(error.message);
  return (data ?? []) as WorkWithLinks[];
}

export async function isWorkSlugTaken(slug: string, exceptId?: string): Promise<boolean> {
  let query = supabase.from('works').select('id', { count: 'exact', head: true }).eq('slug', slug);
  if (exceptId) query = query.neq('id', exceptId);
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

/** Swap the sort_order of two adjacent works. */
export async function swapWorkOrder(a: { id: string; sort_order: number }, b: { id: string; sort_order: number }): Promise<void> {
  const first = await supabase.from('works').update({ sort_order: b.sort_order }).eq('id', a.id);
  if (first.error) throw new Error(first.error.message);
  const second = await supabase.from('works').update({ sort_order: a.sort_order }).eq('id', b.id);
  if (second.error) throw new Error(second.error.message);
}

export type ImportSummary = { created: number; updated: number; failed: { slug: string; reason: string }[] };

/** Upsert categories and works by slug, replacing each work's service links. */
export async function importWorks(file: WorkImportFile): Promise<ImportSummary> {
  const summary: ImportSummary = { created: 0, updated: 0, failed: [] };

  for (const category of file.categories) {
    const { error } = await supabase
      .from('work_categories')
      .upsert({ slug: category.slug, name: category.name, sort_order: category.sort_order }, { onConflict: 'slug' });
    if (error) summary.failed.push({ slug: `category:${category.slug}`, reason: error.message });
  }

  const { data: categoryRows, error: categoryError } = await supabase.from('work_categories').select('id, slug');
  if (categoryError) throw new Error(categoryError.message);
  const categoryIdBySlug = new Map((categoryRows ?? []).map((row) => [row.slug as string, row.id as string]));

  const { data: existingRows, error: existingError } = await supabase.from('works').select('id, slug');
  if (existingError) throw new Error(existingError.message);
  const existingBySlug = new Map((existingRows ?? []).map((row) => [row.slug as string, row.id as string]));

  for (const work of file.works) {
    const categoryId = work.category_slug ? categoryIdBySlug.get(work.category_slug) ?? null : null;
    if (work.category_slug && !categoryId) {
      summary.failed.push({ slug: work.slug, reason: `Unknown category "${work.category_slug}".` });
      continue;
    }
    const payload = {
      slug: work.slug,
      title: work.title,
      vimeo_id: work.vimeo_id,
      aspect: work.aspect,
      duration_sec: work.duration_sec ?? null,
      thumbnail_url: work.thumbnail_url || null,
      category_id: categoryId,
      client_name: work.client_name ?? null,
      industry: work.industry ?? null,
      year: work.year ?? null,
      short_description: work.short_description ?? null,
      tags: work.tags,
      featured: work.featured,
      published: work.published,
      sort_order: work.sort_order,
      case_study: work.case_study,
    };
    const { data, error } = await supabase.from('works').upsert(payload, { onConflict: 'slug' }).select('id').single();
    if (error || !data) {
      summary.failed.push({ slug: work.slug, reason: error?.message ?? 'Save failed.' });
      continue;
    }
    const { error: deleteError } = await supabase.from('work_services').delete().eq('work_id', data.id);
    if (!deleteError && work.services.length) {
      const { error: linkError } = await supabase
        .from('work_services')
        .insert(work.services.map((link, index) => ({ work_id: data.id, service_slug: link.service_slug, position: link.position ?? index })));
      if (linkError) {
        summary.failed.push({ slug: work.slug, reason: `Saved, but service links failed: ${linkError.message}` });
        continue;
      }
    }
    if (deleteError) {
      summary.failed.push({ slug: work.slug, reason: `Saved, but old service links could not be cleared: ${deleteError.message}` });
      continue;
    }
    if (existingBySlug.has(work.slug)) summary.updated += 1;
    else summary.created += 1;
  }
  return summary;
}

/** Build the export file from the current database rows. */
export function buildWorksExport(categories: { slug: string; name: string; sort_order: number }[], works: WorkWithLinks[]): WorkImportFile {
  return {
    version: 1,
    categories: categories.map((c) => ({ slug: c.slug, name: c.name, sort_order: c.sort_order })),
    works: works.map((w) => ({
      slug: w.slug,
      title: w.title,
      vimeo_id: w.vimeo_id,
      aspect: w.aspect,
      duration_sec: w.duration_sec,
      thumbnail_url: w.thumbnail_url,
      category_slug: w.work_categories?.slug ?? null,
      client_name: w.client_name,
      industry: w.industry,
      year: w.year,
      short_description: w.short_description,
      tags: w.tags ?? [],
      featured: w.featured,
      published: w.published,
      sort_order: w.sort_order,
      services: [...(w.work_services ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((link) => ({ service_slug: link.service_slug, position: link.position })),
      case_study: w.case_study ?? {},
    })),
  };
}
