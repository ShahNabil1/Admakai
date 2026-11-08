import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { EmailCodeForm } from '@/components/careers/EmailCodeForm';
import { applicationSettings } from '@/lib/application.functions';
import { supabase } from '@/lib/supabase';
import { safeCandidatePath } from '@/lib/candidate-rules';
import { seoHead } from '@/lib/seo';
import '@/components/careers/application.css';
import '@/components/careers/candidate.css';
export const Route=createFileRoute('/_site/me/login')({validateSearch:(s:Record<string,unknown>):{redirect?:string}=>({redirect:safeCandidatePath(s['redirect'])}),loader:()=>applicationSettings(),head:()=>seoHead({title:'Candidate sign in | Admakai',description:'Sign in with an email code to track your applications.',path:'/me/login',noindex:true}),component:Page});
function Page(){const {redirect}=Route.useSearch(),settings=Route.useLoaderData(),navigate=useNavigate();const go=()=>navigate({to:safeCandidatePath(redirect),replace:true});useEffect(()=>{let active=true;void supabase.auth.getUser().then(({data})=>{if(active&&data.user)void go();});return()=>{active=false;};},[redirect,navigate]);return <div className="candidate-page"><div className="candidate-login"><h1 className="text-3xl mb-8">My applications</h1><div className="application-panel"><h2>Sign in</h2><EmailCodeForm googleEnabled={settings.google_login_enabled} returnPath={`/me/login?redirect=${encodeURIComponent(safeCandidatePath(redirect))}`} onSignedIn={go}/></div></div></div>;}