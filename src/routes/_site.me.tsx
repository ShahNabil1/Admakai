import { createFileRoute, Link } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";
import { PageHero } from "@/components/public/PageElements";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/_site/me")({
  head: () =>
    seoHead({
      title: "My applications | Admakai",
      description: "Your Admakai application dashboard is coming soon.",
      path: "/me",
      noindex: true,
    }),
  component: () => (
    <div className="public-page">
      <PageHero eyebrow="Careers at Admakai" title="Application dashboard coming soon" intro="" />
      <div className="container-site page-section page-section-top">
        <Button asChild className="page-call">
          <Link to="/careers">Back to careers</Link>
        </Button>
      </div>
    </div>
  ),
});
