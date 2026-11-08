import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { z } from "zod";
import { seoHead } from "@/lib/seo";
export const Route = createFileRoute("/admin_/site-content/plans")({
  ssr: false,
  validateSearch: z.object({ item: z.string().max(60).optional() }),
  head: () =>
    seoHead({
      title: "Site content: plans | Admakai admin",
      description: "Admakai administration: edit monthly plans.",
      path: "/admin/site-content/plans",
      noindex: true,
    }),
  component: lazyRouteComponent(() => import("@/components/admin/AdminPage"), "AdminPage"),
});
