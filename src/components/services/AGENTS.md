# Service foundations
- Preserve existing shared components, theme, global CSS and database; change the service index only when explicitly requested.
- Reuse global semantic tokens and Button; new CSS selectors must be service-prefixed and imported only by service components.
- All service embeds go through VimeoPlayer; preload within 300px, let the SDK play only when visible, stop offscreen and never autoplay under reduced motion.
- Service leaf routes use serviceHead for existing SEO plus Vimeo preconnects; catalogue details reuse the current Book a call flow and preserve the service search parameter.
- Catalogue text lives in src/data/services.ts; foundation media configuration stays in src/content. Missing media or contact data stays honestly unavailable, not invented.
- Goal filtering uses browser-safe service-goals helpers and page-local state; derive counts and visible categories from the same filtered published records to avoid mismatches.
- ServiceFinder uses the supplied pure matcher in event handlers with published slugs and bounded ephemeral history; browser speech APIs are detected only after hydration, with no custom network calls.
- Catalogue and related cards share ServiceCatalogueCard and the browser-safe serviceCardFigure helper; scoped grid/card CSS keeps card changes isolated from detail content and the finder.
- Catalogue category tabs use a browser-safe category helper and page-local state; the list alone binds the footer asset to its background, leaving related cards on a plain band and finder logic independent.- Service detail pages share one ServiceDetailPage template with its own service-sd scoped stylesheet mirroring the Home hero and dark section language, so every catalogue service updates from data alone.
