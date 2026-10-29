import { Outlet,Link,useLocation,useNavigate } from '@tanstack/react-router';
import { useQuery,useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useEffect } from 'react';
import { Home,CalendarDays,Folder,MessageSquare,Files,CreditCard,LogOut,MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { getClientArea } from '@/lib/client.functions';
import { ClientSkeleton } from './ClientSkeleton';
import logo from '@/assets/brand/logo-dark-cropped.png.asset.json';
import './client-area.css';
export const clientItems=[{to:'/app',label:'Home',icon:Home},{to:'/app/calls',label:'My calls',icon:CalendarDays},{to:'/app/projects',label:'Projects',icon:Folder},{to:'/app/reviews',label:'Reviews',icon:MessageSquare},{to:'/app/files',label:'Files',icon:Files},{to:'/app/billing',label:'Billing',icon:CreditCard}] as const;
export function useClientArea(){const fn=useServerFn(getClientArea);return useQuery({queryKey:['client-area'],queryFn:()=>fn(),retry:false,staleTime:30000});}
export function ClientShell(){
 const data=useClientArea();const cache=useQueryClient();const navigate=useNavigate();const path=useLocation({select:l=>l.pathname});
 useEffect(()=>{const id=data.data?.clientId;if(!id)return;const channel=supabase.channel(`client-bookings-${crypto.randomUUID()}`).on('postgres_changes',{event:'*',schema:'public',table:'bookings',filter:`client_id=eq.${id}`},()=>{void cache.invalidateQueries({queryKey:['client-area']});}).subscribe();return()=>{void supabase.removeChannel(channel);};},[data.data?.clientId,cache]);
 const logout=async()=>{await cache.cancelQueries();cache.clear();await supabase.auth.signOut();await navigate({to:'/signin',replace:true});};
 return <div className="client-shell"><aside className="client-sidebar"><Link to="/" className="client-logo"><img src={logo.url} alt="Admakai"/></Link><nav aria-label="Account">{clientItems.map(item=><Button variant="ghost" asChild key={item.to} className={`client-nav ${path===item.to?'active':''}`}><Link to={item.to}><item.icon/><span>{item.label}</span></Link></Button>)}</nav><div className="client-help"><p>Help</p><span>Contact details will appear here when available.</span></div></aside><div className="client-main"><header className="client-top"><Link to="/" className="client-mobile-brand">Admakai</Link><div><span>{data.data?.profile?.full_name || 'Your account'}</span><Button variant="ghost" size="icon" className="client-icon" title="Sign out" aria-label="Sign out" onClick={()=>void logout()}><LogOut/></Button></div></header>{data.isPending?<ClientSkeleton/>:data.isError?<div className="client-empty" role="alert"><h1>Your account couldn’t load.</h1><p>Please try again in a moment.</p><Button onClick={()=>void data.refetch()}>Retry</Button></div>:<Outlet/>}</div><nav className="client-bottom" aria-label="Mobile account">{clientItems.slice(0,4).map(item=><Button asChild variant="ghost" key={item.to} className={path===item.to?'active':''}><Link to={item.to}><item.icon/><span>{item.label}</span></Link></Button>)}</nav></div>;
}
