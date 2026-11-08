import { createFileRoute } from '@tanstack/react-router';
import { ApplicationTracker } from '@/components/careers/CandidateDashboard';
import { seoHead } from '@/lib/seo';
export const Route = createFileRoute('/dashboard/applications/$id')({
  head: () => seoHead({ title: 'Application tracker | Admakai', description: 'Your private Admakai application timeline.', path: '/dashboard/applications/$id', noindex: true }),
  component: Page,
});
function Page() { const { id } = Route.useParams(); return <ApplicationTracker id={id} />; }
