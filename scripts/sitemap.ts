import { writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { loadEnv } from 'vite';
import { SITE_URL } from '../src/data/site';
import { publicSeoPaths } from '../src/data/seo-routes';

export type SitemapEntry = { path: string; lastmod?: string | undefined };
export function sitemapXml(entries: SitemapEntry[]) {
  const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char] ?? char));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map(entry => `<url><loc>${escape(new URL(entry.path, SITE_URL).href.replace(/\/$/, ''))}</loc>${entry.lastmod && Number.isFinite(Date.parse(entry.lastmod)) ? `<lastmod>${escape(new Date(entry.lastmod).toISOString())}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`;
}
export async function collectPublishedProjects(readPage: (offset: number) => Promise<{ slug: string; updated_at?: string }[]>) {
  const entries: SitemapEntry[] = [];
  for (let offset = 0; ; ) {
    const rows = await readPage(offset);
    if (!rows.length) break;
    for (const row of rows) entries.push({ path: `/work/${encodeURIComponent(row.slug)}`, lastmod: row.updated_at });
    offset += rows.length;
  }
  return entries;
}
export async function generateSitemap() {
  const entries: SitemapEntry[] = publicSeoPaths.map(path => ({ path }));
  const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
  const url = env['SUPABASE_URL'] || env['VITE_SUPABASE_URL'];
  const key = env['SUPABASE_PUBLISHABLE_KEY'] || env['VITE_SUPABASE_PUBLISHABLE_KEY'] || env['VITE_SUPABASE_ANON_KEY'];
  if (url?.startsWith('https://') && key) {
    try {
      const client = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { fetch: (input, init) => { const headers = new Headers(init?.headers); headers.set('apikey', key); if (key.startsWith('sb_')) headers.delete('Authorization'); return fetch(input, { ...init, headers, signal: AbortSignal.timeout(5000) }); } },
      });
      const works = await collectPublishedProjects(async offset => {
        const { data, error } = await client.from('works').select('slug,updated_at').eq('published', true).order('id').range(offset, offset + 999);
        if (error) throw error;
        return data ?? [];
      });
      const jobs = await collectPublishedProjects(async offset => {
        const { data, error } = await client.from('jobs').select('slug,updated_at').eq('status', 'open').order('id').range(offset, offset + 999);
        if (error) throw error;
        return data ?? [];
      });
      // Published /services/:slug pages already come from publicSeoPaths.
      entries.push(...works, ...jobs.map(j => ({ ...j, path: j.path.replace(/^\/work\//, '/careers/') })));
    } catch {
      console.warn('Sitemap: public works or jobs unavailable; writing static routes only. No partial list included.');
    }
  } else console.warn('Sitemap: public Supabase configuration unavailable; writing static routes only.');
  await writeFile('public/sitemap.xml', sitemapXml(entries));
  console.log(`Sitemap: wrote ${entries.length} public URLs.`);
}
if ('main' in import.meta && import.meta.main) await generateSitemap();