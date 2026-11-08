import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";
export const Route = createFileRoute("/admin_/hiring/jobs")({
  ssr: false,
  head: () =>
    seoHead({
      title: "Jobs | Admakai Hiring",
      description: "Admakai hiring administration: jobs.",
      path: "/admin/hiring/jobs",
      noindex: true,
    }),
  component: lazyRouteComponent(() => import("@/components/admin/AdminPage"), "AdminPage"),
});
