import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { pageSeo, seoHead, breadcrumbs } from '@/lib/seo';
import { publicTableQuery } from '@/hooks/useSupabaseTable';
import { WorkPage } from '@/components/public/WorkPage';
import { PageError, ProjectNotFound } from '@/components/public/PageElements';
export const Route=createFileRoute('/_site/work/')({
 validateSearch:(search)=>z.object({type:z.string().optional(),client:z.string().optional()}).parse(search),
 loader:async({context})=>{await context.queryClient.ensureQueryData(publicTableQuery('projects'));},
 head:()=>seoHead({...pageSeo.work,path:'/work',jsonLd:[breadcrumbs([{name:'Work',path:'/work'}])]}),
 component:WorkPage,errorComponent:PageError,notFoundComponent:ProjectNotFound,
});
