import { createFileRoute } from '@tanstack/react-router';
import { seoHead, breadcrumbs } from '@/lib/seo';
import { LegalPage } from '@/components/public/LegalPage';
export const Route=createFileRoute('/_site/refund')({head:()=>seoHead({title:'Refund policy | Admakai',description:'Admakai refund policy information. Approved policy text is pending.',path:'/refund',jsonLd:[breadcrumbs([{name:'Refund policy',path:'/refund'}])]}),component:()=> <LegalPage kind="refund"/>});
