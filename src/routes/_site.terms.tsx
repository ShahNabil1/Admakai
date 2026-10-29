import { createFileRoute } from '@tanstack/react-router';
import { seoHead, breadcrumbs } from '@/lib/seo';
import { LegalPage } from '@/components/public/LegalPage';
export const Route=createFileRoute('/_site/terms')({head:()=>seoHead({title:'Terms of service | Admakai',description:'Terms for Admakai accounts, call bookings and AI creative services, including project agreements, consent, digital licensing and revisions.',path:'/terms',jsonLd:[breadcrumbs([{name:'Terms of service',path:'/terms'}])]}),component:()=> <LegalPage kind="terms"/>});
