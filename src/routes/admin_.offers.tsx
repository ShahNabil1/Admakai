import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { z } from "zod";
import { seoHead } from "@/lib/seo";
export const Route = createFileRoute("/admin_/offers")({
  ssr: false,
  validateSearch: z.object({ item: z.string().max(60).optional() }),
  head: () =>
    seoHead({
      title: "Offers | Admakai admin",
      description: "Admakai administration: seasonal offers, discounted prices and the offer bar.",
      path: "/admin/offers",
      noindex: true,
    }),
  component: lazyRouteComponent(() => import("@/components/admin/AdminPage"), "AdminPage"),
});
