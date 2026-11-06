import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it('matches service details independently of the full service index', () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(router.matchRoutes('/services/ai-commercial-30s').at(-1)?.routeId).toBe('/_site/services_/$slug');
  });
  for (const [path, routeId] of [["/work", "/_site/work/"], ["/work/sample-commercial", "/_site/work/$slug"], ["/services", "/_site/services"], ["/pricing", "/_site/pricing"], ["/about", "/_site/about"], ["/book-a-call", "/_site/book-a-call"], ["/privacy", "/_site/privacy"], ["/terms", "/_site/terms"], ["/refund", "/_site/refund"]]) {
    it(`matches ${path} to its public page`, () => {
      const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
      expect(router.matchRoutes(path ?? "/").at(-1)?.routeId).toBe(routeId);
    });
  }
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
});
