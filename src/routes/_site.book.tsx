import { createFileRoute } from '@tanstack/react-router';
import { SlotBookingPage } from '@/components/public/SlotBookingPage';
import { publicTableQuery } from '@/hooks/useSupabaseTable';
import { seoHead } from '@/lib/seo';
export const Route = createFileRoute('/_site/book')({
  loader: ({ context }) => context.queryClient.ensureQueryData(publicTableQuery('site_settings')),
  head: () => seoHead({ title: 'Book Your Admakai Call | Available Times in Dhaka', description: 'Choose an available call time, share your brand brief and request a call with Admakai. No account or password needed to book.', path: '/book' }),
  component: SlotBookingPage,
});