import {createFileRoute,lazyRouteComponent} from "@tanstack/react-router";
import {seoHead} from "@/lib/seo";
export const Route=createFileRoute("/admin_/hiring/interviews")({ssr:false,head:()=>seoHead({title:"Interviews | Admakai Hiring",description:"Private Admakai hiring interviews.",path:"/admin/hiring/interviews",noindex:true}),component:lazyRouteComponent(()=>import("@/components/admin/AdminPage"),"AdminPage")});
