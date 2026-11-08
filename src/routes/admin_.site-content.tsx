import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { z } from "zod";
import { seoHead } from "@/lib/seo";
export const Route = createFileRoute("/admin_/site-content")({
  ssr: false,
  validateSearch: z.object({ item: z.string().max(60).optional() }),
  head: () =>
    seoHead({
      title: "Site content: services | Admakai admin",
      description: "Admakai administration: edit services, categories and prices.",
      path: "/admin/site-content",
      noindex: true,
    }),
  component: lazyRouteComponent(() => import("@/components/admin/AdminPage"), "AdminPage"),
});
