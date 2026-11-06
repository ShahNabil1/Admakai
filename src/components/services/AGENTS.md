# Service foundations
- Preserve existing shared components, theme, global CSS and database; change the service index only when explicitly requested.
- Reuse global semantic tokens and Button; new CSS selectors must be service-prefixed and imported only by service components.
- All service embeds go through VimeoPlayer; preload within 300px, let the SDK play only when visible, stop offscreen and never autoplay under reduced motion.
- Service leaf routes use serviceHead for existing SEO plus Vimeo preconnects; catalogue details reuse the current Book a call flow and preserve the service search parameter.
- Catalogue text lives in src/data/services.ts; foundation media configuration stays in src/content. Missing media or contact data stays honestly unavailable, not invented.