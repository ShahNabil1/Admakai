import { seoHead, breadcrumbs } from '@/lib/seo';
import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_site/privacy")({
  head: () => seoHead({ title: 'Privacy policy | Admakai', description: 'Admakai privacy policy information.', path: '/privacy', jsonLd: [breadcrumbs([{ name: 'Privacy policy', path: '/privacy' }])] }),
  component: () => <section className="container-site footer-legal-placeholder"><h1>Privacy policy</h1><p>Privacy policy details have not yet been provided.</p></section>,
});