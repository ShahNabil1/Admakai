import { pageSeo, seoHead, breadcrumbs } from '@/lib/seo';
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/book-a-call")({
  head: () => seoHead({ ...pageSeo.call, path: '/book-a-call', jsonLd: [breadcrumbs([{ name: 'Book a Call', path: '/book-a-call' }])] }),
  component: Page,
});

function Page() {
  return <h1>Book a Call</h1>;
}
