import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/")({
  head: () => ({
    meta: [
      { title: "Admakai" },
      { name: "description", content: "Admakai — AI advertising agency. Home." },
      { property: "og:title", content: "Home — Admakai" },
      { property: "og:description", content: "Admakai — AI advertising agency. Home." },
    ],
  }),
  component: Page,
});

function Page() {
  return <h1>Home</h1>;
}
