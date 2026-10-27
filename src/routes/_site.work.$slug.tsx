import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/work/$slug")({
  head: () => ({
    meta: [
      { title: "Project — Admakai" },
      { name: "description", content: "Admakai — AI advertising agency. Project." },
      { property: "og:title", content: "Project — Admakai" },
      { property: "og:description", content: "Admakai — AI advertising agency. Project." },
    ],
  }),
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  return <h1>{slug}</h1>;
}
