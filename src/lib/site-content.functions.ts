import { createServerFn } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { categoryValuesSchema, planValuesSchema, reorderSchema, serviceValuesSchema, siteContentErrorMessage } from './site-content-rules';

/** Public: published services, all categories and published plans; never throws (static fallback). */
export const getSiteCatalogue = createServerFn({ method: 'GET' }).handler(async () => {
  const { loadPublicCatalogue } = await import('./site-content.server');
  return loadPublicCatalogue();
});

type DbError = { code?: string; message?: string } | null;
function ok<T>(result: { data: T; error: DbError }): T {
  if (result.error) {
    console.error('Site content save failed', { code: result.error.code ?? null, message: result.error.message });
    throw new Error(siteContentErrorMessage(result.error));
  }
  return result.data;
}
function saved<T>(row: T | null): T {
  if (!row) throw new Error('This change could not be saved. Please refresh and try again.');
  return row;
}
async function requireEditor(context: { supabase: SupabaseClient<Database> }) {
  const allowed = ok(await context.supabase.rpc('can_edit_site_content'));
  if (allowed !== true) throw new Error('Only owners and hiring admins can edit site content.');
}
const id = z.string().uuid();

/** Editors: every row including unpublished ones, for the Site content admin. */
export const readSiteContentAdmin = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    setResponseHeader('Cache-Control', 'no-store');
    await requireEditor(context);
    const db = context.supabase;
    const [services, categories, plans] = await Promise.all([
      db.from('services').select('*').order('sort_order').limit(500),
      db.from('service_categories').select('*').order('sort_order').limit(200),
      db.from('plans').select('*').order('sort_order').limit(50),
    ]);
    return { services: ok(services) ?? [], categories: ok(categories) ?? [], plans: ok(plans) ?? [] };
  });

export const canEditSiteContent = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    setResponseHeader('Cache-Control', 'no-store');
    const { data } = await context.supabase.rpc('can_edit_site_content');
    return data === true;
  });

export const saveSiteService = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: id.nullable(), values: serviceValuesSchema }))
  .handler(async ({ data, context }) => {
    setResponseHeader('Cache-Control', 'no-store');
    await requireEditor(context);
    const db = context.supabase;
    if (data.values.related.length) {
      const found = ok(await db.from('services').select('slug').in('slug', data.values.related)) ?? [];
      const missing = data.values.related.filter(slug => !found.some(row => row.slug === slug));
      if (missing.length) throw new Error(`Related services not found: ${missing.join(', ')}`);
    }
    const query = data.id
      ? db.from('services').update(data.values).eq('id', data.id).select('*').single()
      : db.from('services').insert({ ...data.values, sort_order: 10_000 }).select('*').single();
    return saved(ok(await query));
  });

export const saveSitePlan = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: id.nullable(), values: planValuesSchema }))
  .handler(async ({ data, context }) => {
    setResponseHeader('Cache-Control', 'no-store');
    await requireEditor(context);
    const db = context.supabase;
    const query = data.id
      ? db.from('plans').update(data.values).eq('id', data.id).select('*').single()
      : db.from('plans').insert({ ...data.values, sort_order: 10_000 }).select('*').single();
    return saved(ok(await query));
  });

export const saveSiteCategory = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: id.nullable(), values: categoryValuesSchema }))
  .handler(async ({ data, context }) => {
    setResponseHeader('Cache-Control', 'no-store');
    await requireEditor(context);
    const db = context.supabase;
    const query = data.id
      ? db.from('service_categories').update(data.values).eq('id', data.id).select('*').single()
      : db.from('service_categories').insert({ ...data.values, sort_order: 10_000 }).select('*').single();
    return saved(ok(await query));
  });

export const deleteSiteCategory = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id }))
  .handler(async ({ data, context }) => {
    setResponseHeader('Cache-Control', 'no-store');
    await requireEditor(context);
    const rows = ok(await context.supabase.from('service_categories').delete().eq('id', data.id).select('id')) ?? [];
    if (!rows.length) throw new Error('This category could not be deleted.');
    return { ok: true };
  });

export const reorderSiteContent = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(reorderSchema)
  .handler(async ({ data, context }) => {
    setResponseHeader('Cache-Control', 'no-store');
    await requireEditor(context);
    const changed = ok(await context.supabase.rpc('site_content_reorder', { _kind: data.kind, _ids: data.ids }));
    return { changed: Number(changed ?? 0) };
  });
