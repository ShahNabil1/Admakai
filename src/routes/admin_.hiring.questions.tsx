import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";
export const Route = createFileRoute("/admin_/hiring/questions")({
  ssr: false,
  head: () =>
    seoHead({
      title: "Question bank | Admakai Hiring",
      description: "Admakai hiring administration: question bank.",
      path: "/admin/hiring/questions",
      noindex: true,
    }),
  component: lazyRouteComponent(() => import("@/components/admin/AdminPage"), "AdminPage"),
});
