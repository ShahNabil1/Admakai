import { createFileRoute } from '@tanstack/react-router';
import { seoHead } from '@/lib/seo';

export const Route = createFileRoute('/admin_/$')({
  head: () => seoHead({ title: 'Admin page not found | Admakai', description: 'This administration page does not exist.', path: '/admin', noindex: true }),
  component: () => <h1>Page not found</h1>,
});