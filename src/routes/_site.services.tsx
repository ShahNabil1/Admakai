import { createFileRoute } from '@tanstack/react-router';
import { pageSeo, seoHead, breadcrumbs, serviceSchemas } from '@/lib/seo';
import { faqSchema } from '@/data/faq';
import { publicTableQuery } from '@/hooks/useSupabaseTable';
import { ServicesPage } from '@/components/public/ServicesPage';
import { PageError, ProjectNotFound } from '@/components/public/PageElements';
export const Route=createFileRoute('/_site/services')({loader:async({context})=>{await context.queryClient.ensureQueryData(publicTableQuery('services'));},head:()=>seoHead({...pageSeo.services,path:'/services',jsonLd:[breadcrumbs([{name:'Services',path:'/services'}]),...serviceSchemas(),faqSchema]}),component:ServicesPage,errorComponent:PageError,notFoundComponent:ProjectNotFound});
