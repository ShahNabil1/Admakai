import { createFileRoute } from '@tanstack/react-router';
import { CandidateProfile } from '@/components/careers/CandidateDashboard';
import { seoHead } from '@/lib/seo';
export const Route=createFileRoute('/_candidate/me/profile')({head:()=>seoHead({title:'Candidate profile | Admakai',description:'Your candidate details and email preferences.',path:'/me/profile',noindex:true}),component:CandidateProfile});