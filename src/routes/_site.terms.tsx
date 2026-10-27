import { createFileRoute } from '@tanstack/react-router';
import { seoHead, breadcrumbs } from '@/lib/seo';
import { LegalPage } from '@/components/public/LegalPage';
export const Route=createFileRoute('/_site/terms')({head:()=>seoHead({title:'Terms of service | Admakai',description:'Admakai terms of service information. Approved policy text is pending.',path:'/terms',jsonLd:[breadcrumbs([{name:'Terms of service',path:'/terms'}])]}),component:()=> <LegalPage kind="terms"/>});
