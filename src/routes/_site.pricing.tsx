import { createFileRoute } from '@tanstack/react-router';
import { pageSeo, seoHead, breadcrumbs, monthlyPlanSchema } from '@/lib/seo';
import { PricingPage } from '@/components/public/PricingPage';
import { PageError, ProjectNotFound } from '@/components/public/PageElements';
export const Route=createFileRoute('/_site/pricing')({head:()=>seoHead({...pageSeo.pricing,path:'/pricing',jsonLd:[breadcrumbs([{name:'Pricing',path:'/pricing'}]),monthlyPlanSchema()]}),component:PricingPage,errorComponent:PageError,notFoundComponent:ProjectNotFound});
