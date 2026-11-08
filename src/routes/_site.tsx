import { organizationSchema } from '@/lib/seo';
import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";
import { siteQueryOptions } from "@/lib/site-query";

export const Route = createFileRoute("/_site")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteQueryOptions),
  head: ({ loaderData }) => ({ scripts: [{ type: "application/ld+json", children: JSON.stringify(organizationSchema(loaderData?.site)).replace(/</g, "\\u003c") }] }),
  errorComponent: () => <div role="alert">This page could not load. Please refresh.</div>,
  notFoundComponent: () => <div>Page not found.</div>,
  component: Layout,
});

function Layout() {
  const isHome = useLocation({ select: location => location.pathname === '/' });
  const isApplication = useLocation({ select: location => /^\/careers\/[^/]+\/apply(?:\/done)?\/?$/.test(location.pathname) });
  return (
    <>
      <Navbar hero />
      <main>
        {isHome ? <Outlet /> : <PageTransition><Outlet /></PageTransition>}
      </main>
      {!isApplication && <Footer />}
    </>
  );
}
