import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";
export const Route = createFileRoute("/admin_/hiring/settings")({
  ssr: false,
  head: () =>
    seoHead({
      title: "Hiring settings | Admakai Hiring",
      description: "Admakai hiring administration: hiring settings.",
      path: "/admin/hiring/settings",
      noindex: true,
    }),
  component: lazyRouteComponent(() => import("@/components/admin/AdminPage"), "AdminPage"),
});
