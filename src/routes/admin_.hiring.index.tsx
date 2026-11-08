import {createFileRoute,lazyRouteComponent} from "@tanstack/react-router";
import {seoHead} from "@/lib/seo";
export const Route=createFileRoute("/admin_/hiring/")({ssr:false,head:()=>seoHead({title:"Overview | Admakai Hiring",description:"Private Admakai hiring overview.",path:"/admin/hiring/",noindex:true}),component:lazyRouteComponent(()=>import("@/components/admin/AdminPage"),"AdminPage")});
