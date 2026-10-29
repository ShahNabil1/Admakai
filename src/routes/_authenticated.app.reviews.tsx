import { createFileRoute } from '@tanstack/react-router';
import { ClientEmpty } from '@/components/client/ClientPages';
import { seoHead } from '@/lib/seo';
export const Route=createFileRoute('/_authenticated/app/reviews')({head:()=>seoHead({title:'Reviews | Admakai',description:'Your private Admakai reviews space.',path:'/app/reviews',noindex:true}),component:()=> <ClientEmpty title="Reviews"/>});
