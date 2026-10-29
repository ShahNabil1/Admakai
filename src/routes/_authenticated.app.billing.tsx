import { createFileRoute } from '@tanstack/react-router';
import { ClientBilling } from '@/components/client/ClientBilling';
import { seoHead } from '@/lib/seo';
export const Route=createFileRoute('/_authenticated/app/billing')({head:()=>seoHead({title:'Billing | Admakai',description:'Your private Admakai billing space.',path:'/app/billing',noindex:true}),component:ClientBilling});
