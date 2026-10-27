import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Admakai" },
      { name: "description", content: "Admakai — AI advertising agency. Admin." },
      { property: "og:title", content: "Admin — Admakai" },
      { property: "og:description", content: "Admakai — AI advertising agency. Admin." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <h1>Admin</h1>;
}
