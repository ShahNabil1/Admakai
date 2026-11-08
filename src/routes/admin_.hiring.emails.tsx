import {createFileRoute,lazyRouteComponent} from '@tanstack/react-router';
import {seoHead} from '@/lib/seo';
export const Route=createFileRoute('/admin_/hiring/emails')({ssr:false,head:()=>seoHead({title:'Email templates and log | Admakai Hiring',description:'Manage Admakai hiring email templates and log.',path:'/admin/hiring/emails',noindex:true}),component:lazyRouteComponent(()=>import('@/components/admin/AdminPage'),'AdminPage')});
