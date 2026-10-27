import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/services")({
  head: () => ({
    meta: [
      { title: "Services — Admakai" },
      { name: "description", content: "Admakai — AI advertising agency. Services." },
      { property: "og:title", content: "Services — Admakai" },
      { property: "og:description", content: "Admakai — AI advertising agency. Services." },
    ],
  }),
  component: Page,
});

function Page() {
  return <h1>Services</h1>;
}
