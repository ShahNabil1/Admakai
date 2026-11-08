import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";
export const Route = createFileRoute("/admin_/hiring/jobs_/$id")({
  ssr: false,
  head: () =>
    seoHead({
      title: "Job editor | Admakai Hiring",
      description: "Admakai hiring administration: job editor.",
      path: "/admin/hiring/jobs",
      noindex: true,
    }),
  component: lazyRouteComponent(() => import("@/components/admin/AdminPage"), "AdminPage"),
});
