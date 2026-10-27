import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";
import { siteQueryOptions } from "@/lib/site-query";

export const Route = createFileRoute("/_site")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteQueryOptions),
  errorComponent: () => <div role="alert">This page could not load. Please refresh.</div>,
  notFoundComponent: () => <div>Page not found.</div>,
  component: Layout,
});

function Layout() {
  const isHome = useLocation({ select: location => location.pathname === '/' });
  return (
    <>
      <Navbar hero={isHome} />
      <main>
        {isHome ? <Outlet /> : <PageTransition><Outlet /></PageTransition>}
      </main>
      <Footer />
    </>
  );
}
