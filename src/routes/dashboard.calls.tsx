import { createFileRoute } from '@tanstack/react-router';
import { DashboardCalls } from '@/components/dashboard/DashboardCalls';
import { seoHead } from '@/lib/seo';
export const Route = createFileRoute('/dashboard/calls')({
  validateSearch: (s: Record<string, unknown>): { book?: boolean } => (s['book'] === true || s['book'] === 'true' ? { book: true } : {}),
  head: () => seoHead({ title: 'Your calls | Admakai', description: 'Book a call and see your upcoming and past calls with Admakai.', path: '/dashboard/calls', noindex: true }),
  component: Page,
});
function Page() { const { book } = Route.useSearch(); const navigate = Route.useNavigate(); return <DashboardCalls book={!!book} onBookChange={open => void navigate({ search: open ? { book: true } : {}, replace: true })} />; }
