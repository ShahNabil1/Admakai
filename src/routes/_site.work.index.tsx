import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { seoHead, breadcrumbs } from '@/lib/seo';
import { publishedWorksQueryOptions, workCategoriesQueryOptions } from '@/lib/works';
import { WorkPage } from '@/components/public/WorkPage';
import { PageError, ProjectNotFound } from '@/components/public/PageElements';

export const Route = createFileRoute('/_site/work/')({
  validateSearch: (search) => z.object({ cat: z.string().optional(), q: z.string().optional() }).parse(search),
  loader: async ({ context }) => {
    const [works] = await Promise.all([
      context.queryClient.ensureQueryData(publishedWorksQueryOptions),
      context.queryClient.ensureQueryData(workCategoriesQueryOptions),
    ]);
    const featured = works.find((w) => w.featured && w.thumbnail_url) ?? works.find((w) => w.thumbnail_url);
    return { ogImage: featured?.thumbnail_url ?? null };
  },
  head: ({ loaderData }) => seoHead({
    title: 'Our Work | Admakai',
    description: 'Ad films, reels and visuals we made with AI. No shoot days. Browse Admakai commercials, UGC ads, product films and fashion films by category.',
    path: '/work',
    ...(loaderData?.ogImage ? { ogImage: loaderData.ogImage } : {}),
    jsonLd: [breadcrumbs([{ name: 'Work', path: '/work' }])],
  }),
  component: WorkPage,
  errorComponent: PageError,
  notFoundComponent: ProjectNotFound,
});
