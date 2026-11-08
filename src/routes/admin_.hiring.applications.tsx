import {createFileRoute,lazyRouteComponent} from "@tanstack/react-router";
import {seoHead} from "@/lib/seo";
export const Route=createFileRoute("/admin_/hiring/applications")({ssr:false,head:()=>seoHead({title:"Applications | Admakai Hiring",description:"Private Admakai hiring applications.",path:"/admin/hiring/applications",noindex:true}),component:lazyRouteComponent(()=>import("@/components/admin/AdminPage"),"AdminPage")});
