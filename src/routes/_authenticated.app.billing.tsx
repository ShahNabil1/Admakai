import { createFileRoute } from '@tanstack/react-router';
import { ClientEmpty } from '@/components/client/ClientPages';
import { seoHead } from '@/lib/seo';
export const Route=createFileRoute('/_authenticated/app/billing')({head:()=>seoHead({title:'Billing | Admakai',description:'Your private Admakai billing space.',path:'/app/billing',noindex:true}),component:()=> <ClientEmpty title="Billing"/>});
