import { createFileRoute } from '@tanstack/react-router';
import { ClientDelivery } from '@/components/delivery/ProjectsWorkspace';
import { seoHead } from '@/lib/seo';
export const Route=createFileRoute('/_authenticated/app/projects')({head:()=>seoHead({title:'Projects | Admakai',description:'Your private Admakai projects space.',path:'/app/projects',noindex:true}),component:()=> <ClientDelivery view="projects"/>});
