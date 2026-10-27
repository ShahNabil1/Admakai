import { pageSeo, seoHead, breadcrumbs, serviceSchemas } from '@/lib/seo';
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/services")({
  head: () => seoHead({ ...pageSeo.services, path: '/services', jsonLd: [breadcrumbs([{ name: 'Services', path: '/services' }]), ...serviceSchemas()] }),
  component: Page,
});

function Page() {
  return <><h1>Services</h1><p className="seo-intro">Explore AI advertising services in Bangladesh, from human-led commercials and UGC ads to product photoshoots, voice and dubbing.</p><div className="sr-only"><span id="ai-commercials" /><span id="ai-ugc-ads" /><span id="ai-product-photoshoot" /><span id="brand-models-digital-clones" /><span id="brand-models-and-clones" /><span id="ai-voice-dubbing" /><span id="ai-voice-and-dubbing" /><span id="motion-logo-animation" /><span id="fashion-films-lookbooks" /><span id="ad-variants-localisation" /></div></>;
}
