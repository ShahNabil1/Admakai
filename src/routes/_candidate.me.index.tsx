import { createFileRoute } from '@tanstack/react-router';
import { MyApplications } from '@/components/careers/CandidateDashboard';
import { seoHead } from '@/lib/seo';
export const Route=createFileRoute('/_candidate/me/')({head:()=>seoHead({title:'My applications | Admakai',description:'Track your Admakai applications and upcoming interviews.',path:'/me',noindex:true}),component:MyApplications});