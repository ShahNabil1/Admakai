import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/about")({
  head: () => ({
    meta: [
      { title: "About — Admakai" },
      { name: "description", content: "Admakai — AI advertising agency. About." },
      { property: "og:title", content: "About — Admakai" },
      { property: "og:description", content: "Admakai — AI advertising agency. About." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <h1>About</h1>;
}
