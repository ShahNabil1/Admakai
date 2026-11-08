import { createFileRoute } from '@tanstack/react-router';
import { CandidateJourney } from '@/components/careers/CandidateJourney';
import { seoHead } from '@/lib/seo';
export const Route = createFileRoute('/dashboard/journey')({
  head: () => seoHead({ title: 'Team journey | Admakai', description: 'Your team journey at Admakai.', path: '/dashboard/journey', noindex: true }),
  component: Page,
});
function Page() { return <CandidateJourney />; }
