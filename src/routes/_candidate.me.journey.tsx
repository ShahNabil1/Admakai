import { createFileRoute } from '@tanstack/react-router';
import { seoHead } from '@/lib/seo';
import {CandidateJourney} from '@/components/careers/CandidateJourney';
export const Route=createFileRoute('/_candidate/me/journey')({head:()=>seoHead({title:'Team journey | Admakai',description:'Your team journey at Admakai.',path:'/me/journey',noindex:true}),component:CandidateJourney});