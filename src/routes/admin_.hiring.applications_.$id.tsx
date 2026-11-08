import {createFileRoute,lazyRouteComponent} from "@tanstack/react-router";
import {seoHead} from "@/lib/seo";
export const Route=createFileRoute("/admin_/hiring/applications_/$id")({ssr:false,head:()=>seoHead({title:"Applicant profile | Admakai Hiring",description:"Private Admakai hiring applicant profile.",path:"/admin/hiring/applications/$id",noindex:true}),component:lazyRouteComponent(()=>import("@/components/admin/AdminPage"),"AdminPage")});
