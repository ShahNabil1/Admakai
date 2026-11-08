import { createFileRoute, Link } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/public/PageElements";
export const Route = createFileRoute("/_site/careers/$slug/apply")({
  head: ({ params }) =>
    seoHead({
      title: "Apply | Careers at Admakai",
      description: "The Admakai application form is coming soon.",
      path: `/careers/${params.slug}/apply`,
      noindex: true,
    }),
  component: Placeholder,
});
function Placeholder() {
  const { slug } = Route.useParams();
  return (
    <div className="public-page careers career-placeholder">
      <PageHero eyebrow="Careers at Admakai" title="Application form coming soon" intro="" />
      <div className="container-site page-section page-section-top">
        <Button asChild className="page-call">
          <Link to="/careers/$slug" params={{ slug }}>
            Back to role
          </Link>
        </Button>
      </div>
    </div>
  );
}
