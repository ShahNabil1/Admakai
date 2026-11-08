import { createFileRoute } from '@tanstack/react-router';
import { DashboardSettings } from '@/components/dashboard/DashboardSettings';
import { seoHead } from '@/lib/seo';
export const Route = createFileRoute('/dashboard/profile')({
  head: () => seoHead({ title: 'Your profile | Admakai', description: 'Your Admakai profile and email preferences.', path: '/dashboard/profile', noindex: true }),
  component: Page,
});
function Page() { return <DashboardSettings />; }
