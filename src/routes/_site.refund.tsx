import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_site/refund")({
  head: () => ({ meta: [{ title: "Refund policy — Admakai" }, { name: "description", content: "Admakai refund policy information." }, { property: "og:title", content: "Refund policy — Admakai" }, { property: "og:description", content: "Admakai refund policy information." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <section className="container-site footer-legal-placeholder"><h1>Refund policy</h1><p>Refund policy details have not yet been provided.</p></section>,
});