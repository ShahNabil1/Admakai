import { createFileRoute } from '@tanstack/react-router';
import { ClientHome } from '@/components/client/ClientPages';
import { seoHead } from '@/lib/seo';
export const Route=createFileRoute('/_authenticated/app/')({head:()=>seoHead({title:'Your Studio Space | Admakai',description:'Your calls, product photos and shared notes with Admakai.',path:'/app',noindex:true}),component:ClientHome});
