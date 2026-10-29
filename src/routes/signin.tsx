import { createFileRoute,useNavigate } from '@tanstack/react-router';
import { useEffect,useState,type FormEvent } from 'react';
import { Mail,ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { safeAppPath } from '@/lib/client-rules';
import { seoHead } from '@/lib/seo';
import '@/components/client/client-area.css';
export const Route=createFileRoute('/signin')({validateSearch:(search:Record<string,unknown>)=>({redirect:safeAppPath(search['redirect'])}),head:()=>seoHead({title:'Sign In | Admakai',description:'Sign in to your Admakai account with a secure email link.',path:'/signin',noindex:true}),component:SignIn});
function SignIn(){const {redirect}=Route.useSearch();const navigate=useNavigate();const [email,setEmail]=useState('');const [sent,setSent]=useState(false);const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [seconds,setSeconds]=useState(0);
 useEffect(()=>{void supabase.auth.getUser().then(({data})=>{if(data.user)void navigate({to:safeAppPath(redirect),replace:true});});},[navigate,redirect]);
 useEffect(()=>{if(!seconds)return;const timer=setTimeout(()=>setSeconds(n=>Math.max(n-1,0)),1000);return()=>clearTimeout(timer);},[seconds]);
 const send=async(event?:FormEvent)=>{event?.preventDefault();if(busy||seconds)return;setBusy(true);setError('');try{sessionStorage.setItem('admakai-auth-destination',safeAppPath(redirect));const {error}=await supabase.auth.signInWithOtp({email:email.trim().toLowerCase(),options:{shouldCreateUser:true,emailRedirectTo:`${window.location.origin}/app`}});if(error)throw error;setSent(true);setSeconds(60);}catch(reason){setError(reason instanceof Error?reason.message:'The sign-in link could not be sent. Please try again.');}finally{setBusy(false);}};
 return <main className="client-signin"><section className="client-signin-card"><span className="client-signin-icon"><Mail/></span><h1>{sent?'Check your email':'Sign in to Admakai'}</h1>{sent?<><p>We sent a sign-in link to {email.trim()}. The link expires in an hour.</p><p className="client-small">Check spam if it hasn’t arrived.</p><Button variant="link" className="client-text-button" disabled={!!seconds||busy} onClick={()=>void send()}>{seconds?`Resend in ${seconds}s`:'Resend link'}</Button></>:<><p>Enter your email and we will send you a link. No password needed.</p><form onSubmit={event=>void send(event)}><label htmlFor="signin-email">Email</label><input id="signin-email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/><Button className="client-dark-button" type="submit" disabled={busy||!email.trim()}>{busy?'Sending link…':'Email me a link'}<ArrowUpRight/></Button></form></>}{error&&<p role="alert" className="client-error">{error}</p>}</section></main>;
}
