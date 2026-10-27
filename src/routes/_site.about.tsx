import { pageSeo, seoHead, breadcrumbs, canonicalUrl } from '@/lib/seo';
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/about")({
  head: () => seoHead({ ...pageSeo.about, path: '/about', jsonLd: [breadcrumbs([{ name: 'About', path: '/about' }]), { '@context': 'https://schema.org', '@type': 'AboutPage', name: 'About Admakai', url: canonicalUrl('/about'), about: { '@id': 'https://admakai.com/#organization' } }] }),
  component: Page,
});

function Page() {
  return <h1 id="ai-policy">About</h1>;
}
