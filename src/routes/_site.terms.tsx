import { seoHead, breadcrumbs } from '@/lib/seo';
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_site/terms")({
  head: () => seoHead({ title: 'Terms | Admakai', description: 'Admakai terms of service information.', path: '/terms', jsonLd: [breadcrumbs([{ name: 'Terms', path: '/terms' }])] }),
  component: () => <section className="container-site footer-legal-placeholder"><h1>Terms</h1><p>Terms of service have not yet been provided.</p></section>,
});