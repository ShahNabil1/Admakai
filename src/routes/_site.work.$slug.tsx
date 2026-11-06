import { createFileRoute, notFound } from '@tanstack/react-router';
import { seoHead, breadcrumbs } from '@/lib/seo';
import { publicTableQuery } from '@/hooks/useSupabaseTable';
import type { Project } from '@/data/projects';
import { getWorkBySlug } from '@/lib/works';
import { ProjectPage } from '@/components/public/ProjectPage';
import { WorkDetailPage } from '@/components/public/WorkDetailPage';
import { PageError, ProjectNotFound } from '@/components/public/PageElements';

export const Route = createFileRoute('/_site/work/$slug')({
  loader: async ({ context, params }) => {
    // Legacy project entries still resolve first; everything else falls back to the works tables.
    const rows = await context.queryClient.ensureQueryData(publicTableQuery('projects'));
    const project = (rows as unknown as Project[]).find((p) => p.slug === params.slug && p.isPublished);
    if (project) return { kind: 'project' as const, project };
    const work = await getWorkBySlug(params.slug).catch(() => null);
    if (work && work.published) return { kind: 'work' as const, work };
    throw notFound();
  },
  head: ({ params, loaderData }) => {
    if (loaderData?.kind === 'work') {
      const work = loaderData.work;
      return seoHead({
        title: work.seo_title || `${work.title} | Admakai`,
        description: work.seo_description || work.short_description || 'Watch this Admakai production.',
        path: `/work/${encodeURIComponent(params.slug)}`,
        ...(work.thumbnail_url ? { ogImage: work.thumbnail_url } : {}),
        jsonLd: [breadcrumbs([{ name: 'Work', path: '/work' }, { name: work.title, path: `/work/${encodeURIComponent(params.slug)}` }])],
      });
    }
    const project = loaderData?.project;
    return seoHead({
      title: project ? `${project.title} | Admakai` : 'Project unavailable | Admakai',
      description: project?.resultLine || 'This project has moved. Explore the Admakai portfolio.',
      path: `/work/${encodeURIComponent(params.slug)}`,
      noindex: !project || project.isPlaceholder,
      jsonLd: [breadcrumbs([{ name: 'Work', path: '/work' }, { name: project?.title || 'Project', path: `/work/${encodeURIComponent(params.slug)}` }])],
    });
  },
  component: function WorkSlugRoute() {
    const data = Route.useLoaderData();
    return data.kind === 'work' ? <WorkDetailPage work={data.work} /> : <ProjectPage />;
  },
  errorComponent: PageError,
  notFoundComponent: ProjectNotFound,
});
