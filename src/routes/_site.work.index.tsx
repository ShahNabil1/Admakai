import { createFileRoute } from '@tanstack/react-router';
import { pageSeo, seoHead, breadcrumbs } from '@/lib/seo';
import { publicTableQuery } from '@/hooks/useSupabaseTable';
import { WorkPage } from '@/components/public/WorkPage';
import { PageError, ProjectNotFound } from '@/components/public/PageElements';
export const Route=createFileRoute('/_site/work/')({
 validateSearch:(search:Record<string,unknown>)=>({type:typeof search['type']==='string'?search['type']:undefined,client:typeof search['client']==='string'?search['client']:undefined}),
 loader:async({context})=>{await context.queryClient.ensureQueryData(publicTableQuery('projects'));},
 head:()=>seoHead({...pageSeo.work,path:'/work',jsonLd:[breadcrumbs([{name:'Work',path:'/work'}])]}),
 component:WorkPage,errorComponent:PageError,notFoundComponent:ProjectNotFound,
});
