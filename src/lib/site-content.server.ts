import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { catalogueFromRows, staticCatalogue, type Catalogue } from './site-content';

/** Public catalogue read with the publishable key (RLS returns only published services and plans); static copy on any failure. */
export async function loadPublicCatalogue(): Promise<Catalogue> {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) return staticCatalogue();
  try {
    const client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
        headers.set('apikey', key);
        return fetch(input, { ...init, headers, signal: AbortSignal.timeout(3000) });
      } },
    });
    const [services, categories, plans] = await Promise.all([
      client.from('services').select('*').eq('is_published', true).order('sort_order').limit(500),
      client.from('service_categories').select('*').order('sort_order').limit(200),
      client.from('plans').select('*').eq('is_published', true).order('sort_order').limit(50),
    ]);
    if (services.error || categories.error || plans.error) {
      console.error('Site catalogue read failed; using static fallback', services.error?.code ?? categories.error?.code ?? plans.error?.code);
      return staticCatalogue();
    }
    return catalogueFromRows({ services: services.data, categories: categories.data, plans: plans.data });
  } catch (error) {
    console.error('Site catalogue unreachable; using static fallback', error instanceof Error ? error.name : 'unknown');
    return staticCatalogue();
  }
}
