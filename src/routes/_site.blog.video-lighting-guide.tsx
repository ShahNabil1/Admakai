import { createFileRoute } from "@tanstack/react-router";
import { seoHead, breadcrumbs, canonicalUrl } from '@/lib/seo';
import { SITE_URL } from '@/data/site';
import { lightingPost as post } from '@/data/blog';
import { LightingPost } from '@/components/blog/LightingPost';

const head = seoHead({
  title: post.seoTitle, description: post.description, path: post.path, type: 'article',
  jsonLd: [
    { '@context': 'https://schema.org', '@type': 'Article', headline: post.title, datePublished: post.datePublished, inLanguage: 'bn', mainEntityOfPage: canonicalUrl(post.path), author: { '@type': 'Organization', name: 'Admakai', url: SITE_URL }, publisher: { '@type': 'Organization', name: 'Admakai', url: SITE_URL } },
    breadcrumbs([{ name: 'ব্লগ', path: '/blog' }, { name: post.title, path: post.path }]),
  ],
});

export const Route = createFileRoute("/_site/blog/video-lighting-guide")({
  head: () => ({
    ...head,
    links: [
      ...head.links,
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Anton&family=Noto+Serif+Bengali:wght@700&display=swap' },
    ],
  }),
  component: LightingPost,
});
