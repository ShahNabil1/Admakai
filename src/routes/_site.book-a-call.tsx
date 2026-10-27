import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { pageSeo, seoHead, breadcrumbs } from '@/lib/seo';
import { publicTableQuery } from '@/hooks/useSupabaseTable';
import { BookingPage } from '@/components/public/BookingPage';
import { PageError, ProjectNotFound } from '@/components/public/PageElements';
export const Route=createFileRoute('/_site/book-a-call')({validateSearch:(search)=>z.object({service:z.string().optional(),plan:z.string().optional()}).parse(search),loader:async({context})=>{await Promise.all([context.queryClient.ensureQueryData(publicTableQuery('services')),context.queryClient.ensureQueryData(publicTableQuery('site_settings'))]);},head:()=>seoHead({...pageSeo.call,path:'/book-a-call',jsonLd:[breadcrumbs([{name:'Book a Call',path:'/book-a-call'}])]}),component:BookingPage,errorComponent:PageError,notFoundComponent:ProjectNotFound});
