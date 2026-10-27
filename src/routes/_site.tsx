import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";

export const Route = createFileRoute("/_site")({
  component: Layout,
});

function Layout() {
  const isHome = useLocation({ select: location => location.pathname === '/' });
  return (
    <>
      {!isHome && <Navbar />}
      <main>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      {!isHome && <Footer />}
    </>
  );
}
