import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";
export const Route = createFileRoute("/admin_/hiring/agreements")({
  ssr: false,
  head: () =>
    seoHead({
      title: "Agreements | Admakai Hiring",
      description: "Admakai hiring administration: agreements.",
      path: "/admin/hiring/agreements",
      noindex: true,
    }),
  component: lazyRouteComponent(() => import("@/components/admin/AdminPage"), "AdminPage"),
});
