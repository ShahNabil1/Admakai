import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { safeCandidatePath } from '@/lib/candidate-rules';
export const Route=createFileRoute('/_candidate')({ssr:false,beforeLoad:async({location})=>{const {data}=await supabase.auth.getUser();if(!data.user)throw redirect({to:'/me/login',search:{redirect:safeCandidatePath(location.pathname)}});},component:()=> <><Navbar hero/><main><Outlet/></main><Footer/></>});