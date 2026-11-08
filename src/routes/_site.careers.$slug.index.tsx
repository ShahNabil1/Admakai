import { createFileRoute } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";
import { jobPosting } from "@/lib/careers-rules";
import { careerDetailOptions } from "@/lib/careers-query";
import { JobDetailsPage } from "@/components/careers/JobDetailsPage";
import { PageError } from "@/components/public/PageElements";
export const Route = createFileRoute("/_site/careers/$slug/")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(careerDetailOptions(params.slug)),
  head: ({ loaderData, params }) => {
    const job = loaderData?.job;
    const schema = job ? jobPosting(job) : null;
    return seoHead({
      title: job ? `${job.title} | Careers at Admakai` : "Role unavailable | Careers at Admakai",
      description:
        job?.summary || "Explore career opportunities with the Admakai AI filmmaking team.",
      path: `/careers/${params.slug}`,
      noindex: !job,
      jsonLd: schema ? [schema] : [],
      ...(job?.cover_image_url ? { ogImage: job.cover_image_url } : {}),
    });
  },
  component: () => {
    const { slug } = Route.useParams();
    return <JobDetailsPage slug={slug} />;
  },
  errorComponent: PageError,
});
