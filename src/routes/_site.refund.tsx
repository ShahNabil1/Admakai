import { seoHead, breadcrumbs } from '@/lib/seo';
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_site/refund")({
  head: () => seoHead({ title: 'Refund policy | Admakai', description: 'Admakai refund policy information.', path: '/refund', jsonLd: [breadcrumbs([{ name: 'Refund policy', path: '/refund' }])] }),
  component: () => <section className="container-site footer-legal-placeholder"><h1>Refund policy</h1><p>Refund policy details have not yet been provided.</p></section>,
});