import { createFileRoute, redirect } from '@tanstack/react-router';
import { findPublishedService } from '@/data/services';
import { serviceHead } from '@/components/services/service-head';
import { ServiceDetailPage } from '@/components/services/ServiceDetailPage';
import { servicePortfolioWorksQueryOptions } from '@/lib/service-works';
import { PageError } from '@/components/public/PageElements';
import { ensureCatalogue } from '@/lib/site-catalogue-query';

export const Route = createFileRoute('/_site/services_/$slug')({
  loader: async ({ params, context }) => {
    // Child loaders run alongside the layout loader, so read the live catalogue here too; unpublished or unknown slugs go back to /services.
    await ensureCatalogue(context.queryClient);
    const service = findPublishedService(params.slug);
    if (!service) throw redirect({ to: '/services', replace: true });
    await context.queryClient.ensureQueryData(servicePortfolioWorksQueryOptions(service.slug));
    return service;
  },
  head: ({ params, loaderData }) => serviceHead({
    title: loaderData ? loaderData.seoTitle ?? `${loaderData.name} | Admakai` : 'Services | Admakai',
    description: loaderData?.seoDescription ?? loaderData?.shortDescription ?? 'Explore Admakai services.',
    path: `/services/${encodeURIComponent(params.slug)}`, noindex: !loaderData,
  }),
  component: () => <ServiceDetailPage service={Route.useLoaderData()}/>,
  errorComponent: PageError,
  notFoundComponent: () => <LinkBack/>,
});

function LinkBack() { return <p className="container-site page-hero">This service is unavailable.</p>; }