import { seoHead } from '@/lib/seo';
/** Use in each future service leaf route's head(), never in the root. */
export function serviceHead(options: Parameters<typeof seoHead>[0]) {
  const head = seoHead(options);
  return { ...head, links: [...head.links, { rel: 'preconnect', href: 'https://player.vimeo.com' }, { rel: 'preconnect', href: 'https://i.vimeocdn.com' }] };
}
