# Service foundations
- Keep service work additive; never edit existing routes, shared components, theme, global CSS or database for service requests.
- Reuse global semantic tokens and Button; new CSS selectors must be service-prefixed and imported only by service components.
- All service embeds go through VimeoPlayer; preload within 300px, let the SDK play only when visible, stop offscreen and never autoplay under reduced motion.
- Future service leaf routes use serviceHead for existing SEO plus Vimeo preconnects; link to the existing /book route and preserve requested service search parameters.
- Keep configuration in src/content; missing media or contact data stays honestly unavailable, not invented.