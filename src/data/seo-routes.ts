import { publishedServices } from './services';
const serviceDetailPaths = publishedServices().map(service => `/services/${service.slug}`);
export const publicSeoPaths = ['/', '/work', '/services', '/pricing', '/about', '/book', '/careers', '/blog', '/blog/sazdah-tvc', '/blog/video-lighting-guide', '/privacy', '/terms', '/refund', ...serviceDetailPaths];
export const staticServiceDetailPaths = serviceDetailPaths;
// Pages showing editable services or plans (Home, /services, /pricing, /services/:slug) render on request so admin edits and unpublishing apply without republishing.
export const prerenderPaths = ['/work', '/about'];