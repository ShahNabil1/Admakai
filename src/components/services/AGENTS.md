# Service foundations
- Preserve existing shared components, theme, global CSS and database; change the service index only when explicitly requested.
- Reuse global semantic tokens and Button; new CSS selectors must be service-prefixed and imported only by service components.
- Service lightbox embeds use VimeoPlayer; work scroller previews use the shared VideoPreviewCard controller for global muted playback, with reduced motion and saveData respected.
- Service leaf routes use serviceHead for existing SEO plus Vimeo preconnects; catalogue details reuse the current Book a call flow and preserve the service search parameter.
- Catalogue text lives in the services table (src/data/services.ts is the registry plus static fallback); foundation media configuration stays in src/content. Missing media or contact data stays honestly unavailable, not invented.
- Goal filtering uses browser-safe service-goals helpers and page-local state; derive counts and visible categories from the same filtered published records to avoid mismatches.
- ServiceFinder uses the supplied pure matcher in event handlers with published slugs and bounded ephemeral history; browser speech APIs are detected only after hydration, with no custom network calls.
- Catalogue and related cards share ServiceCatalogueCard and the browser-safe serviceCardFigure helper; scoped grid/card CSS keeps card changes isolated from detail content and the finder.
- Service price displays share ServicePrice/useCurrency; USD service amounts stay in catalogue data, while browser-only exchange caching is isolated from Finder event handlers.
- Catalogue category tabs use a browser-safe category helper and page-local state; the list alone binds the footer asset to its background, leaving related cards on a plain band and finder logic independent.
- Service detail pages share the numbered ServiceDetailPage landing template and service-sd stylesheet; service content, category use cases, category use cases and verified proof stay browser-safe and separate from the catalogue UI.

- Detail heroes read heroTitle directly; the previous ServiceHero module stays unused for this layout. Service portfolio scrollers read admin-managed works (direct service links, else same-category fallback) via service-works; VideoPreviewCard handles media previews and VimeoPlayer preserves the existing lightbox.
