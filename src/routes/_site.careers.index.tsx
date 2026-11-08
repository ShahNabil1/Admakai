import { createFileRoute } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";
import { careerJobsOptions, internshipVideoOptions } from "@/lib/careers-query";
import { CareersPage } from "@/components/careers/CareersPage";
import { PageError } from "@/components/public/PageElements";
import { validateBoardSearch } from '@/lib/career-board-rules';
export const Route = createFileRoute("/_site/careers/")({
  validateSearch: validateBoardSearch,
  loader: async ({ context }) => {
    const [jobs] = await Promise.all([context.queryClient.ensureQueryData(careerJobsOptions), context.queryClient.ensureQueryData(internshipVideoOptions)]);
    return jobs;
  },
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
