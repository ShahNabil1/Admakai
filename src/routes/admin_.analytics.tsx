import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";
export const Route = createFileRoute("/admin_/analytics")({
  ssr: false,
  head: () =>
    seoHead({
      title: "Analytics | Admakai admin",
      description: "Admakai administration: visitors, pages, journeys, booking funnel and unfinished bookings.",
      path: "/admin/analytics",
      noindex: true,
    }),
  component: lazyRouteComponent(() => import("@/components/admin/AdminPage"), "AdminPage"),
});
