import { createFileRoute } from '@tanstack/react-router';
import { pageSeo, seoHead, breadcrumbs, canonicalUrl } from '@/lib/seo';
import { AboutPage } from '@/components/public/AboutPage';
import { PageError, ProjectNotFound } from '@/components/public/PageElements';
export const Route=createFileRoute('/_site/about')({head:()=>seoHead({...pageSeo.about,path:'/about',jsonLd:[breadcrumbs([{name:'About',path:'/about'}]),{'@context':'https://schema.org','@type':'AboutPage',name:'About Admakai',url:canonicalUrl('/about'),about:{'@id':'https://admakai.com/#organization'}}]}),component:AboutPage,errorComponent:PageError,notFoundComponent:ProjectNotFound});
