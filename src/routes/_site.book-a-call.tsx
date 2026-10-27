import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/book-a-call")({
  head: () => ({
    meta: [
      { title: "Book a Call — Admakai" },
      { name: "description", content: "Admakai — AI advertising agency. Book a Call." },
      { property: "og:title", content: "Book a Call — Admakai" },
      { property: "og:description", content: "Admakai — AI advertising agency. Book a Call." },
    ],
  }),
  component: Page,
});

function Page() {
  return <h1>Book a Call</h1>;
}
