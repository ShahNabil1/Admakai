import { createFileRoute, notFound } from '@tanstack/react-router';
import { seoHead, breadcrumbs } from '@/lib/seo';
import { publicTableQuery } from '@/hooks/useSupabaseTable';
import type { Project } from '@/data/projects';
import { ProjectPage } from '@/components/public/ProjectPage';
import { PageError, ProjectNotFound } from '@/components/public/PageElements';
export const Route=createFileRoute('/_site/work/$slug')({
 loader:async({context,params})=>{const [rows]=await Promise.all([context.queryClient.ensureQueryData(publicTableQuery('projects')),context.queryClient.ensureQueryData(publicTableQuery('services'))]);const project=(rows as unknown as Project[]).find(p=>p.slug===params.slug&&p.isPublished);if(!project)throw notFound();return project;},
 head:({params,loaderData})=>seoHead({title:loaderData?`${loaderData.title} | Admakai`:'Project unavailable | Admakai',description:loaderData?.resultLine||'This project has moved. Explore the Admakai portfolio.',path:`/work/${encodeURIComponent(params.slug)}`,noindex:!loaderData||loaderData.isPlaceholder,jsonLd:[breadcrumbs([{name:'Work',path:'/work'},{name:loaderData?.title||'Project',path:`/work/${encodeURIComponent(params.slug)}`}])]}),
 component:ProjectPage,errorComponent:PageError,notFoundComponent:ProjectNotFound,
});
