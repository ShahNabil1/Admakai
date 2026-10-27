import { createFileRoute } from "@tanstack/react-router";
import { HomeHero } from '@/components/home/HomeHero';
import { TrustedClients } from '@/components/home/TrustedClients';
import { DirectorAi } from '@/components/home/DirectorAi';

export const Route = createFileRoute("/_site/")({
  head: () => ({
    meta: [
      { title: "Admakai | AI Ad Agency in Bangladesh for Commercials, Product Films and Social Content" },
      { name: "description", content: "Admakai is an AI advertising studio in Dhaka. Human-led AI commercials, product films, UGC ads and social content, delivered in days without a shoot." },
      { property: "og:title", content: "Admakai | AI Ad Agency in Bangladesh for Commercials, Product Films and Social Content" },
      { property: "og:description", content: "Admakai is an AI advertising studio in Dhaka. Human-led AI commercials, product films, UGC ads and social content, delivered in days without a shoot." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <><HomeHero /><TrustedClients /><DirectorAi /></>;
}
