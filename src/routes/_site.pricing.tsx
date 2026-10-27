import { pageSeo, seoHead, breadcrumbs, monthlyPlanSchema } from '@/lib/seo';
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/pricing")({
  head: () => seoHead({ ...pageSeo.pricing, path: '/pricing', jsonLd: [breadcrumbs([{ name: 'Pricing', path: '/pricing' }]), monthlyPlanSchema()] }),
  component: Page,
});

function Page() {
  return <><h1>Pricing</h1><p className="seo-intro">Explore AI ad pricing for monthly content plans and individual projects, including commercials, UGC ads and product photoshoots.</p></>;
}
