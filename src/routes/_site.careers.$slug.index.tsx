import { createFileRoute } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";
import { jobPosting } from "@/lib/careers-rules";
import { careerDetailOptions, internshipVideoOptions } from "@/lib/careers-query";
import { JobDetailsPage } from "@/components/careers/JobDetailsPage";
import { PageError } from "@/components/public/PageElements";
import { hiringMediaPath } from "@/lib/hiring-media";
export const Route = createFileRoute("/_site/careers/$slug/")({
  loader: async ({ context, params }) => {
    const [detail] = await Promise.all([context.queryClient.ensureQueryData(careerDetailOptions(params.slug)), context.queryClient.ensureQueryData(internshipVideoOptions)]);
    return detail;
  },
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
      ...(job?.cover_image_url && !hiringMediaPath(job.cover_image_url) ? { ogImage: job.cover_image_url } : {}),
    });
  },
  component: () => {
    const { slug } = Route.useParams();
    return <JobDetailsPage slug={slug} />;
  },
  errorComponent: PageError,
});
