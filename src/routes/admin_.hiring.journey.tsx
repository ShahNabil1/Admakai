import {createFileRoute,lazyRouteComponent} from '@tanstack/react-router';
import {seoHead} from '@/lib/seo';
export const Route=createFileRoute('/admin_/hiring/journey')({ssr:false,head:()=>seoHead({title:'Team journey | Admakai Hiring',description:'Manage Admakai hiring team journey.',path:'/admin/hiring/journey',noindex:true}),component:lazyRouteComponent(()=>import('@/components/admin/AdminPage'),'AdminPage')});
