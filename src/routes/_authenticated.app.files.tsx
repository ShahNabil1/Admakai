import { createFileRoute } from '@tanstack/react-router';
import { ClientEmpty } from '@/components/client/ClientPages';
import { seoHead } from '@/lib/seo';
export const Route=createFileRoute('/_authenticated/app/files')({head:()=>seoHead({title:'Files | Admakai',description:'Your private Admakai files space.',path:'/app/files',noindex:true}),component:()=> <ClientEmpty title="Files"/>});
