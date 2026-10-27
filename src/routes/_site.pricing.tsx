import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Admakai" },
      { name: "description", content: "Admakai — AI advertising agency. Pricing." },
      { property: "og:title", content: "Pricing — Admakai" },
      { property: "og:description", content: "Admakai — AI advertising agency. Pricing." },
    ],
  }),
  component: Page,
});

function Page() {
  return <h1>Pricing</h1>;
}
