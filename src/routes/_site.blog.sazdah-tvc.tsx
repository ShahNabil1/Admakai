import { createFileRoute } from "@tanstack/react-router";
import { seoHead, breadcrumbs, canonicalUrl } from '@/lib/seo';
import { SITE_URL } from '@/data/site';
import { sazdahPost as post } from '@/data/blog';
import { SazdahPost } from '@/components/blog/SazdahPost';

const image = `${SITE_URL}${post.cover}`;

export const Route = createFileRoute("/_site/blog/sazdah-tvc")({
  head: () => seoHead({ lang: 'bn',
    title: post.seoTitle, description: post.description, path: post.path, type: 'article', ogImage: image,
    jsonLd: [
      { '@context': 'https://schema.org', '@type': 'Article', headline: post.title, image: [image], datePublished: post.datePublished, inLanguage: 'bn', mainEntityOfPage: canonicalUrl(post.path), author: { '@type': 'Organization', name: 'Admakai', url: SITE_URL }, publisher: { '@type': 'Organization', name: 'Admakai', url: SITE_URL } },
      breadcrumbs([{ name: 'ব্লগ', path: '/blog' }, { name: post.title, path: post.path }]),
    ],
  }),
  component: SazdahPost,
});
