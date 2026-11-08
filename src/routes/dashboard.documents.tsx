import { createFileRoute } from '@tanstack/react-router';
import { CandidateDocuments } from '@/components/careers/CandidateDashboard';
import { seoHead } from '@/lib/seo';
export const Route = createFileRoute('/dashboard/documents')({
  head: () => seoHead({ title: 'Your documents | Admakai', description: 'Your Admakai agreements and letters.', path: '/dashboard/documents', noindex: true }),
  component: Page,
});
function Page() { return <CandidateDocuments />; }
