import { publishedServices } from './services';
const serviceDetailPaths = publishedServices().map(service => `/services/${service.slug}`);
export const publicSeoPaths = ['/', '/work', '/services', '/pricing', '/about', '/book', '/blog', '/blog/sazdah-tvc', '/privacy', '/terms', '/refund', ...serviceDetailPaths];
export const prerenderPaths = ['/', '/work', '/services', '/pricing', '/about', ...serviceDetailPaths];