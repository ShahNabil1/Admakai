import { createFileRoute, redirect } from '@tanstack/react-router';
import { findPublishedService } from '@/data/services';
import { serviceHead } from '@/components/services/service-head';
import { ServiceDetailPage } from '@/components/services/ServiceDetailPage';
import { servicePortfolioWorksQueryOptions } from '@/lib/service-works';
import { PageError } from '@/components/public/PageElements';

export const Route = createFileRoute('/_site/services_/$slug')({
  loader: async ({ params, context }) => {
    const service = findPublishedService(params.slug);
    if (!service) throw redirect({ to: '/services', replace: true });
    await context.queryClient.ensureQueryData(servicePortfolioWorksQueryOptions(service.slug));
    return service;
  },
  head: ({ params, loaderData }) => serviceHead({
    title: loaderData ? `${loaderData.name} | Admakai` : 'Services | Admakai',
    description: loaderData?.shortDescription ?? 'Explore Admakai services.',
    path: `/services/${encodeURIComponent(params.slug)}`, noindex: !loaderData,
  }),
  component: () => <ServiceDetailPage service={Route.useLoaderData()}/>,
  errorComponent: PageError,
  notFoundComponent: () => <LinkBack/>,
});

function LinkBack() { return <p className="container-site page-hero">This service is unavailable.</p>; }