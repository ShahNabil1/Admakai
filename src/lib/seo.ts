import { SITE_URL, siteFallback, type SiteDetails } from '@/data/site';
import { contentPartner as currentContentPartner } from '@/data/pricing';
import { publishedServices } from '@/data/services';
import darkLogo from '@/assets/brand/logo-dark-cropped.png.asset.json';

export type JsonLd = Record<string, unknown>;
export function canonicalUrl(path: string) {
  const url = new URL(path, SITE_URL);
  if (url.origin !== SITE_URL) throw new Error('Canonical must use the production domain');
  url.search = ''; url.hash = '';
  url.pathname = url.pathname.replace(/\/+$/, '') || '/';
  return url.href.replace(/\/$/, '');
}

export const pageSeo = {
  home: { title: 'Admakai | AI Ad Agency in Bangladesh for Commercials', description: 'Human-led AI commercials, product films, UGC ads and social content from Dhaka. First cut in 5 days, no shoot. A Branta Tech sister concern.' },
  work: { title: 'AI Ad Examples and Case Studies | Admakai', description: 'Watch the best AI ads we have shipped: commercials, product films, UGC and brand models for Bangladeshi and international brands.' },
  services: { title: 'AI Advertising Services: Commercials and UGC | Admakai', description: '37 AI advertising services including AI commercials, AI UGC ads, AI product photoshoots, brand models, clones, voice and dubbing.' },
  pricing: { title: 'AI Ad Pricing in Bangladesh | Admakai', description: 'Transparent AI ad pricing: monthly content plans and per project prices for commercials, UGC ads, photoshoots and more.' },
  about: { title: 'About Admakai | AI Advertising Studio in Dhaka', description: 'A small Dhaka team making humanized AI ads since 2024. Part of the Branta Tech family. Our process, our AI policy, our people.' },
  call: { title: 'Book a Call | Admakai', description: 'Fifteen minutes, one photo, a plan and a price. Book a free call or message Admakai on WhatsApp.' },
} as const;

export function seoHead({ title, description, path, type = 'website', ogImage, jsonLd = [], noindex = false, lang = 'en' }: {
  title: string; description: string; path: string; type?: string; ogImage?: string; jsonLd?: JsonLd[]; noindex?: boolean; lang?: 'en' | 'bn';
}) {
  const canonical = canonicalUrl(path);
  return {
    meta: [
      { title }, { name: 'description', content: description },
      { property: 'og:title', content: title }, { property: 'og:description', content: description },
      { property: 'og:type', content: type }, { property: 'og:url', content: canonical },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title }, { name: 'twitter:description', content: description },
      { name: 'robots', content: noindex ? 'noindex, nofollow' : 'index, follow' },
      ...(ogImage?.startsWith('https://') ? [{ property: 'og:image', content: ogImage }, { name: 'twitter:image', content: ogImage }] : []),
    ],
    links: [{ rel: 'canonical', href: canonical }, { rel: 'alternate', hrefLang: lang, href: canonical }, { rel: 'alternate', hrefLang: 'x-default', href: canonical }],
    scripts: jsonLd.map(schema => ({ type: 'application/ld+json', children: JSON.stringify(schema).replace(/</g, '\\u003c') })),
  };
}

const organizationId = `${SITE_URL}/#organization`;
export function organizationSchema(site: SiteDetails = siteFallback): JsonLd {
  const contact = { ...(site.WHATSAPP ? { telephone: `+${site.WHATSAPP}` } : {}), ...(site.EMAIL ? { email: site.EMAIL } : {}) };
  return {
    '@context': 'https://schema.org', '@type': 'Organization', '@id': organizationId,
    name: 'Admakai', url: SITE_URL, logo: new URL(darkLogo.url, SITE_URL).href,
    sameAs: Object.values(site.SOCIALS).filter(Boolean),
    ...(Object.keys(contact).length ? { contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', ...contact } } : {}),
    address: { '@type': 'PostalAddress', addressLocality: 'Dhaka', addressCountry: 'BD' },
    foundingDate: '2026', parentOrganization: { '@type': 'Organization', name: 'Branta Tech' },
    description: 'AI advertising studio making human-led AI commercials, product films and social content.',
  };
}
export function localBusinessSchema(): JsonLd {
  return { ...organizationSchema(), '@type': 'ProfessionalService', '@id': `${SITE_URL}/#studio`, areaServed: ['Bangladesh', 'Worldwide'] };
}
export function breadcrumbs(items: { name: string; path: string }[]): JsonLd {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ name: 'Home', path: '/' }, ...items].map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: canonicalUrl(item.path) })) };
}
export function serviceSchemas(): JsonLd[] {
  return publishedServices().map(service => ({ '@context': 'https://schema.org', '@type': 'Service', name: service.name, description: service.shortDescription, provider: { '@id': organizationId }, areaServed: ['Bangladesh', 'Worldwide'], url: canonicalUrl(`/services/${service.slug}`) }));
}
export function monthlyPlanSchema(): JsonLd {
  const contentPartner = currentContentPartner();
  return { '@context': 'https://schema.org', '@type': 'Product', name: 'Admakai Content Partner', description: `${contentPartner.videos} videos and ${contentPartner.statics} statics every month. First cut in ${contentPartner.firstCutDays} days or the month is free.`, brand: { '@type': 'Brand', name: 'Admakai' }, offers: { '@type': 'AggregateOffer', lowPrice: contentPartner.priceMinUsd, highPrice: contentPartner.priceMaxUsd, priceCurrency: 'USD', url: canonicalUrl('/pricing') } };
}