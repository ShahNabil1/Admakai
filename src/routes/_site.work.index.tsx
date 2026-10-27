import { pageSeo, seoHead, breadcrumbs } from '@/lib/seo';
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/work/")({
  head: () => seoHead({ ...pageSeo.work, path: '/work', jsonLd: [breadcrumbs([{ name: 'Work', path: '/work' }])] }),
  component: Page,
});

function Page() {
  return <><h1>Work</h1><p className="seo-intro">Browse AI ad examples: commercials, product films, UGC and brand models for brands in Bangladesh and beyond.</p></>;
}
