import { createFileRoute,Outlet,redirect } from '@tanstack/react-router';
import { supabase } from '@/lib/supabase';
import { safeAppPath } from '@/lib/client-rules';
import { ClientSkeleton } from '@/components/client/ClientSkeleton';
export const Route=createFileRoute('/_authenticated')({ssr:false,beforeLoad:async({location})=>{const {data,error}=await supabase.auth.getUser();if(error||!data.user)throw redirect({to:'/signin',search:{redirect:safeAppPath(location.pathname)}});return {user:data.user};},pendingComponent:ClientSkeleton,pendingMs:0,component:Outlet});
