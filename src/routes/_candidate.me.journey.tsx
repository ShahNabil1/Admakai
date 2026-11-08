import { createFileRoute } from '@tanstack/react-router';
import { seoHead } from '@/lib/seo';
export const Route=createFileRoute('/_candidate/me/journey')({head:()=>seoHead({title:'Team journey | Admakai',description:'Your team journey at Admakai.',path:'/me/journey',noindex:true}),component:()=> <><h1>Welcome to the team</h1><p>Your team journey will appear here soon.</p></>});