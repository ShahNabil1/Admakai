import { queryOptions } from '@tanstack/react-query';
import { supabase } from './supabase';
import type { Work, WorkCategory, WorkServiceLink } from '@/types/work';

export type WorkWithLinks = Work & {
  work_categories: WorkCategory | null;
  work_services: WorkServiceLink[];
};

function fail(error: { message: string } | null): never | void {
  if (error) throw new Error(error.message);
}

export async function listCategories(): Promise<WorkCategory[]> {
  const { data, error } = await supabase.from('work_categories').select('*').order('sort_order');
  fail(error);
  return (data ?? []) as WorkCategory[];
}

export async function listPublishedWorks(): Promise<WorkWithLinks[]> {
  const { data, error } = await supabase
    .from('works')
    .select('*, work_categories(*), work_services(service_slug, position)')
    .eq('published', true)
    .order('featured', { ascending: false })
    .order('sort_order');
  fail(error);
  return (data ?? []) as WorkWithLinks[];
}

export async function getWorkBySlug(slug: string): Promise<WorkWithLinks | null> {
  const { data, error } = await supabase
    .from('works')
    .select('*, work_categories(*), work_services(service_slug, position)')
    .eq('slug', slug)
    .maybeSingle();
  fail(error);
  return (data as WorkWithLinks | null) ?? null;
}

export async function getRelatedWorks(work: Work, limit = 4): Promise<WorkWithLinks[]> {
  if (!work.category_id) return [];
  const { data, error } = await supabase
    .from('works')
    .select('*, work_categories(*), work_services(service_slug, position)')
    .eq('published', true)
    .eq('category_id', work.category_id)
    .neq('id', work.id)
    .order('featured', { ascending: false })
    .order('sort_order')
    .limit(limit);
  fail(error);
  return (data ?? []) as WorkWithLinks[];
}

export async function getWorksForService(serviceSlug: string): Promise<WorkWithLinks[]> {
  const { data, error } = await supabase
    .from('work_services')
    .select('position, works(*, work_categories(*), work_services(service_slug, position))')
    .eq('service_slug', serviceSlug)
    .order('position');
  fail(error);
  return (data ?? [])
    .map(row => (row as unknown as { works: WorkWithLinks | null }).works)
    .filter((work): work is WorkWithLinks => Boolean(work));
}

export const workCategoriesQueryOptions = queryOptions({
  queryKey: ['work-categories'],
  queryFn: listCategories,
  staleTime: 60000,
});

export const publishedWorksQueryOptions = queryOptions({
  queryKey: ['works', 'published'],
  queryFn: listPublishedWorks,
  staleTime: 60000,
});

export const workBySlugQueryOptions = (slug: string) => queryOptions({
  queryKey: ['works', 'slug', slug],
  queryFn: () => getWorkBySlug(slug),
  staleTime: 60000,
});

export const worksForServiceQueryOptions = (serviceSlug: string) => queryOptions({
  queryKey: ['works', 'service', serviceSlug],
  queryFn: () => getWorksForService(serviceSlug),
  staleTime: 60000,
});

// Admin functions. Every write is gated server side by the app.is_manager() policies.

export type WorkInput = Partial<Omit<Work, 'id' | 'created_at' | 'updated_at'>> & Pick<Work, 'slug' | 'title' | 'vimeo_id'>;

export async function createWork(input: WorkInput): Promise<Work> {
  const { data, error } = await supabase.from('works').insert(input).select().single();
  fail(error);
  return data as Work;
}

export async function updateWork(id: string, input: Partial<WorkInput>): Promise<Work> {
  const { data, error } = await supabase.from('works').update(input).eq('id', id).select().single();
  fail(error);
  return data as Work;
}

export async function deleteWork(id: string): Promise<void> {
  const { error } = await supabase.from('works').delete().eq('id', id);
  fail(error);
}

export async function setWorkServices(workId: string, links: WorkServiceLink[]): Promise<void> {
  const { error: removeError } = await supabase.from('work_services').delete().eq('work_id', workId);
  fail(removeError);
  if (!links.length) return;
  const rows = links.map((link, index) => ({ work_id: workId, service_slug: link.service_slug, position: link.position ?? index }));
  const { error } = await supabase.from('work_services').insert(rows);
  fail(error);
}

export async function reorderServiceWorks(serviceSlug: string, orderedWorkIds: string[]): Promise<void> {
  for (const [index, workId] of orderedWorkIds.entries()) {
    const { error } = await supabase
      .from('work_services')
      .update({ position: index })
      .eq('service_slug', serviceSlug)
      .eq('work_id', workId);
    fail(error);
  }
}

export async function createCategory(input: { slug: string; name: string; sort_order?: number }): Promise<WorkCategory> {
  const { data, error } = await supabase.from('work_categories').insert(input).select().single();
  fail(error);
  return data as WorkCategory;
}

export async function updateCategory(id: string, input: Partial<{ slug: string; name: string; sort_order: number }>): Promise<WorkCategory> {
  const { data, error } = await supabase.from('work_categories').update(input).eq('id', id).select().single();
  fail(error);
  return data as WorkCategory;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('work_categories').delete().eq('id', id);
  fail(error);
}

export async function reorderCategories(orderedIds: string[]): Promise<void> {
  for (const [index, id] of orderedIds.entries()) {
    const { error } = await supabase.from('work_categories').update({ sort_order: index }).eq('id', id);
    fail(error);
  }
}
