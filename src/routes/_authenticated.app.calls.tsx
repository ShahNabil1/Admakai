import { createFileRoute } from '@tanstack/react-router';
import { ClientCalls } from '@/components/client/ClientPages';
import { seoHead } from '@/lib/seo';
export const Route=createFileRoute('/_authenticated/app/calls')({head:()=>seoHead({title:'My Calls | Admakai',description:'Your Admakai call history and shared notes.',path:'/app/calls',noindex:true}),component:ClientCalls});
