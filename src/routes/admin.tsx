import { seoHead } from '@/lib/seo';
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => seoHead({ title: 'Admin | Admakai', description: 'Admakai administration area.', path: '/admin', noindex: true }),
  component: lazyRouteComponent(() => import("@/components/admin/AdminPage"), "AdminPage"),
});
