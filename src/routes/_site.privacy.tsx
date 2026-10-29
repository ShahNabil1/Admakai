import { createFileRoute } from '@tanstack/react-router';
import { seoHead, breadcrumbs } from '@/lib/seo';
import { LegalPage } from '@/components/public/LegalPage';
export const Route=createFileRoute('/_site/privacy')({head:()=>seoHead({title:'Privacy policy | Admakai',description:'How Admakai handles account details, bookings, uploads and Google sign-in information, including privacy choices and deletion requests.',path:'/privacy',jsonLd:[breadcrumbs([{name:'Privacy policy',path:'/privacy'}])]}),component:()=> <LegalPage kind="privacy"/>});
