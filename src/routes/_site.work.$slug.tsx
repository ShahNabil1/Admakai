import { seoHead, breadcrumbs } from '@/lib/seo';
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/work/$slug")({
  head: ({ params }) => seoHead({ title: `${params.slug.replace(/-/g, ' ')} | AI Project | Admakai`, description: 'AI advertising project by Admakai. Project details have not yet been provided.', path: `/work/${encodeURIComponent(params.slug)}`, noindex: true, jsonLd: [breadcrumbs([{ name: 'Work', path: '/work' }, { name: params.slug, path: `/work/${encodeURIComponent(params.slug)}` }])] }),
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  return <h1>{slug}</h1>;
}
