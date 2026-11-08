import { createFileRoute } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";
import { ApplicationDone } from "@/components/careers/ApplicationDone";
export const Route = createFileRoute("/_site/careers/$slug/apply/done")({
  head: ({ params }) =>
    seoHead({
      title: "Application submitted | Admakai",
      description: "Your Admakai application confirmation and next hiring stages.",
      path: `/careers/${params.slug}/apply/done`,
      noindex: true,
    }),
  component: () => {
    const { slug } = Route.useParams();
    return <ApplicationDone slug={slug} />;
  },
});
