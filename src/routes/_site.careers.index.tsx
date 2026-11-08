import { createFileRoute } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";
import { careerJobsOptions } from "@/lib/careers-query";
import { CareersPage } from "@/components/careers/CareersPage";
import { PageError } from "@/components/public/PageElements";
export const Route = createFileRoute("/_site/careers/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(careerJobsOptions),
  head: () =>
    seoHead({
      title: "Careers at Admakai",
      description:
        "Join Admakai in Dhaka. Explore AI video careers, our six-month internship program and a clear path from hands-on learning to paid projects.",
      path: "/careers",
    }),
  component: CareersPage,
  errorComponent: PageError,
});
