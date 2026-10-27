import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import { leadSchema, validateAttachment } from './lead-schema';
import { services } from '@/data/services';
export const submitLead=createServerFn({method:'POST'}).inputValidator((input:FormData)=>{if(!(input instanceof FormData))throw new Error('Invalid form.');const fields=Object.fromEntries([...input.entries()].filter(([key])=>key!=='attachment'));const values=leadSchema.parse(fields);const attached=input.get('attachment');const file=attached instanceof File&&attached.size?attached:null;const error=validateAttachment(file);if(error)throw new Error(error);return {values,file};}).handler(async({data})=>{
 const {values,file}=data;
 if(values.website)return {status:'saved' as const};
 if(values.service_slug&&!services.some(s=>s.slug===values.service_slug)&&values.service_slug!=='not-sure')return {status:'error' as const};
 if(values.plan_slug&&!['starter','growth','scale'].includes(values.plan_slug))return {status:'error' as const};
 const url=process.env['SUPABASE_URL'];const key=process.env['SUPABASE_PUBLISHABLE_KEY']||process.env['SUPABASE_ANON_KEY'];
 if(!url||!key)return {status:'unavailable' as const};
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const headers=new Headers(init?.headers);if(key.startsWith('sb_'))headers.delete('Authorization');headers.set('apikey',key);return fetch(input,{...init,headers,signal:AbortSignal.timeout(10000)});}}});
 let attachment:string|null=null;
 try {
  if(file){const bytes=new Uint8Array(await file.arrayBuffer());const png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10;const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;if((file.type==='image/png'&&!png)||(file.type==='image/jpeg'&&!jpg))return {status:'error' as const};const path=`enquiries/${crypto.randomUUID()}.${png?'png':'jpg'}`;const {error}=await client.storage.from('leads').upload(path,file,{contentType:file.type,upsert:false});if(error)return {status:'unavailable' as const};attachment=path;}
  const message=[values.plan_slug?`Plan: ${values.plan_slug}`:'',values.message].filter(Boolean).join('\n');
  const {error}=await client.from('leads').insert({name:values.name,brand:values.brand,whatsapp:values.whatsapp,email:values.email||null,service_slug:values.service_slug||null,budget_range:values.budget_range||null,message,attachment_url:attachment,status:'new'});
  if(error){if(attachment)await client.storage.from('leads').remove([attachment]);return {status:'unavailable' as const};}
  return {status:'saved' as const};
 }catch {if(attachment)await client.storage.from('leads').remove([attachment]);return {status:'error' as const};}
});
