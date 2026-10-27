import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/work/")({
  head: () => ({
    meta: [
      { title: "Work — Admakai" },
      { name: "description", content: "Admakai — AI advertising agency. Work." },
      { property: "og:title", content: "Work — Admakai" },
      { property: "og:description", content: "Admakai — AI advertising agency. Work." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <h1>Work</h1>;
}
