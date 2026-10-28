import { seoHead, pageSeo, localBusinessSchema } from '@/lib/seo';
import { createFileRoute } from "@tanstack/react-router";
import { HomeHero } from '@/components/home/HomeHero';
import { TrustedClients } from '@/components/home/TrustedClients';
import { DirectorAi } from '@/components/home/DirectorAi';
import { ToolStack } from '@/components/home/ToolStack';
import { Capabilities } from '@/components/home/Capabilities';
import { WorkingFormats } from '@/components/home/WorkingFormats';
import { Ethics } from '@/components/home/Ethics';
import { Pricing } from '@/components/home/Pricing';
import { Faq } from '@/components/home/Faq';
import { MossValley } from '@/components/home/MossValley';
import { faqSchema } from '@/data/faq';

export const Route = createFileRoute("/_site/")({
  head: () => seoHead({ ...pageSeo.home, path: '/', jsonLd: [localBusinessSchema(), faqSchema] }),
  component: Page,
});

function Page() {
  return <><HomeHero /><TrustedClients /><DirectorAi /><Capabilities /><MossValley /><ToolStack /><WorkingFormats /><Ethics /><Pricing /><Faq /><p className="sr-only">Admakai is a sister concern of Branta Tech, an AI design and technology company in Dhaka.</p></>;
}
