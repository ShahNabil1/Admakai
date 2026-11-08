import { createFileRoute } from '@tanstack/react-router';
import { DashboardHome } from '@/components/dashboard/DashboardHome';
import { seoHead } from '@/lib/seo';
export const Route = createFileRoute('/dashboard/')({
  head: () => seoHead({ title: 'Your dashboard | Admakai', description: 'Your Admakai calls, applications and journey in one place.', path: '/dashboard', noindex: true }),
  component: Page,
});
function Page() { return <DashboardHome />; }
