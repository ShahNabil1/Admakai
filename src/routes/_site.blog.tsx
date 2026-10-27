import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Admakai" },
      { name: "description", content: "Admakai — AI advertising agency. Blog." },
      { property: "og:title", content: "Blog — Admakai" },
      { property: "og:description", content: "Admakai — AI advertising agency. Blog." },
    ],
  }),
  component: Page,
});

function Page() {
  return <h1>Blog</h1>;
}
