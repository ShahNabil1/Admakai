import { createFileRoute } from "@tanstack/react-router";
import { HomeHero } from '@/components/home/HomeHero';
import { TrustedClients } from '@/components/home/TrustedClients';

export const Route = createFileRoute("/_site/")({
  head: () => ({
    meta: [
      { title: "Admakai — AI commercials without a shoot" },
      { name: "description", content: "AI commercials, product films and social content by Admakai. Brief us on a call and see the first cut in five days." },
      { property: "og:title", content: "Admakai — Your next ad doesn't need a shoot" },
      { property: "og:description", content: "AI commercials, product films and social content. Book a call with Admakai." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <><HomeHero /><TrustedClients /></>;
}
