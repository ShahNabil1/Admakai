import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_site/terms")({
  head: () => ({ meta: [{ title: "Terms — Admakai" }, { name: "description", content: "Admakai terms of service information." }, { property: "og:title", content: "Terms — Admakai" }, { property: "og:description", content: "Admakai terms of service information." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <section className="container-site footer-legal-placeholder"><h1>Terms</h1><p>Terms of service have not yet been provided.</p></section>,
});