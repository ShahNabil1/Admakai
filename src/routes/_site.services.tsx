import { createFileRoute } from '@tanstack/react-router';
import { pageSeo, breadcrumbs } from '@/lib/seo';
import { faqSchema } from '@/data/faq';
import { publishedServices } from '@/data/services';
import { serviceHead } from '@/components/services/service-head';
import { ServicesPage } from '@/components/public/ServicesPage';
import { PageError, ProjectNotFound } from '@/components/public/PageElements';
export const Route=createFileRoute('/_site/services')({head:()=>serviceHead({...pageSeo.services,description:`Explore ${publishedServices().length} video advertising, product and fashion imagery services, made without a shoot.`,path:'/services',jsonLd:[breadcrumbs([{name:'Services',path:'/services'}]),faqSchema]}),component:ServicesPage,errorComponent:PageError,notFoundComponent:ProjectNotFound});
