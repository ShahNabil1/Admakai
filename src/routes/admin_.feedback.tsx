import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";
export const Route = createFileRoute("/admin_/feedback")({
  ssr: false,
  head: () =>
    seoHead({
      title: "Portfolio feedback | Admakai admin",
      description: "Admakai administration: video views, reactions and comment approvals.",
      path: "/admin/feedback",
      noindex: true,
    }),
  component: lazyRouteComponent(() => import("@/components/admin/AdminPage"), "AdminPage"),
});
