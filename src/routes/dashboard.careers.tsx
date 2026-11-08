import { createFileRoute } from '@tanstack/react-router';
import { DashboardCareers } from '@/components/dashboard/DashboardCareers';
import { seoHead } from '@/lib/seo';
export const Route = createFileRoute('/dashboard/careers')({
  validateSearch: (s: Record<string, unknown>): { tab?: string } => (s['tab'] === 'roles' ? { tab: 'roles' } : {}),
  head: () => seoHead({ title: 'Careers | Admakai', description: 'Your Admakai applications and open roles.', path: '/dashboard/careers', noindex: true }),
  component: Page,
});
function Page() { const { tab } = Route.useSearch(); const navigate = Route.useNavigate(); return <DashboardCareers tab={tab === 'roles' ? 'roles' : 'applications'} onTab={t => void navigate({ search: t === 'roles' ? { tab: 'roles' } : {}, replace: true })} />; }
