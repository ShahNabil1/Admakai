import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_site/privacy")({
  head: () => ({ meta: [{ title: "Privacy policy — Admakai" }, { name: "description", content: "Admakai privacy policy information." }, { property: "og:title", content: "Privacy policy — Admakai" }, { property: "og:description", content: "Admakai privacy policy information." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <section className="container-site footer-legal-placeholder"><h1>Privacy policy</h1><p>Privacy policy details have not yet been provided.</p></section>,
});