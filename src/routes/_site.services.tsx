import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/services")({
  head: () => ({
    meta: [
      { title: "Services — Admakai" },
      { name: "description", content: "Admakai — AI advertising agency. Services." },
      { property: "og:title", content: "Services — Admakai" },
      { property: "og:description", content: "Admakai — AI advertising agency. Services." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <h1>Services</h1>;
}
