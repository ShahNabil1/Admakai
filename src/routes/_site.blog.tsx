import { seoHead, breadcrumbs } from '@/lib/seo';
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/blog")({
  head: () => seoHead({ title: 'Blog | Admakai', description: 'News and perspectives from Admakai, the AI advertising studio in Dhaka.', path: '/blog', jsonLd: [breadcrumbs([{ name: 'Blog', path: '/blog' }])] }),
  component: Page,
});

function Page() {
  return <h1>Blog</h1>;
}
