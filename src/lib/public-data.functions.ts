import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { projects } from '@/data/projects';
import { services } from '@/data/services';
import { pricingTiers } from '@/data/pricing';
import { team } from '@/data/team';
import { publicSiteKeys } from '@/data/site';
const tableSchema = z.enum(['projects','services','pricing_tiers','team','site_settings']);
const fallbacks = { projects, services, pricing_tiers:pricingTiers, team, site_settings:[] };
const projections = {
 projects:'id,slug,title,client,clientSlug,industry,serviceSlug,type,format,durationSeconds,videoUrl,posterUrl,challenge,approach,resultLine,deliverables,isFeatured,sortOrder,isPublished,createdAt,isPlaceholder,gallery',
 services:'id,slug,family,name,description,deliverables,formats,turnaround,price',
 pricing_tiers:'id,slug,name,forLine,videos,statics,revisionRounds,turnaroundDays,calls,price,badge',
 team:'id,name,role,bio,photoUrl,isPlaceholder',site_settings:'key,value',
};
export const getPublicRows = createServerFn({method:'GET'}).inputValidator((input:unknown)=>tableSchema.parse(input)).handler(async ({data:table})=>{
 const fallback = fallbacks[table];
 const url = process.env['SUPABASE_URL'];
 const key = process.env['SUPABASE_PUBLISHABLE_KEY'] || process.env['SUPABASE_ANON_KEY'];
 if (!url || !key) return fallback;
 try {
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const headers=new Headers(init?.headers);if(key.startsWith('sb_'))headers.delete('Authorization');headers.set('apikey',key);return fetch(input,{...init,headers,signal:AbortSignal.timeout(3000)});}}});
  let query=client.from(table).select(projections[table]).limit(250);
  if(table==='projects')query=query.eq('isPublished',true);
  if(table==='site_settings')query=query.in('key',[...publicSiteKeys,'CALENDLY_URL']);
  const {data,error}=await query;
  return error || !data?.length ? fallback : data;
 } catch { return fallback; }
});
