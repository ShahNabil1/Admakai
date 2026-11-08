import { createFileRoute } from '@tanstack/react-router';
import { CandidateDocuments } from '@/components/careers/CandidateDashboard';
import { seoHead } from '@/lib/seo';
export const Route=createFileRoute('/_candidate/me/documents')({head:()=>seoHead({title:'My documents | Admakai',description:'View and download your privately stored application agreements.',path:'/me/documents',noindex:true}),component:CandidateDocuments});