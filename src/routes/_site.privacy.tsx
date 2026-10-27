import { createFileRoute } from '@tanstack/react-router';
import { seoHead, breadcrumbs } from '@/lib/seo';
import { LegalPage } from '@/components/public/LegalPage';
export const Route=createFileRoute('/_site/privacy')({head:()=>seoHead({title:'Privacy policy | Admakai',description:'Admakai privacy policy information. Approved policy text is pending.',path:'/privacy',jsonLd:[breadcrumbs([{name:'Privacy policy',path:'/privacy'}])]}),component:()=> <LegalPage kind="privacy"/>});
