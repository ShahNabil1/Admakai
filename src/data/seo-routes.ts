// Only concrete public routes. Service anchors are not separate crawlable pages.
export const publicSeoPaths = ['/', '/work', '/services', '/pricing', '/about', '/book-a-call', '/blog', '/privacy', '/terms', '/refund'] as const;
export const prerenderPaths = ['/', '/work', '/services', '/pricing', '/about', '/book-a-call'] as const;