import { createFileRoute, Outlet } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";
import { applicationSettings } from "@/lib/application.functions";
import { getCareerDetail } from "@/lib/careers.functions";
export const Route = createFileRoute("/_site/careers/$slug/apply")({
  loader: async ({ params }) => {
    const [settings, detail] = await Promise.all([
      applicationSettings(),
      getCareerDetail({ data: { slug: params.slug } }),
    ]);
    return { settings, title: detail?.job.title ?? null };
  },
  head: ({ params }) =>
    seoHead({
      title: "Apply | Careers at Admakai",
      description:
        "Apply to Admakai with a secure seven-step application, portfolio and signed agreement.",
      path: `/careers/${params.slug}/apply`,
      noindex: true,
    }),
  component: () => <Outlet />,
});
