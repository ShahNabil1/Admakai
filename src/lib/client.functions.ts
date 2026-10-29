import { createServerFn } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { maxUploadBytes, realFileMime } from './client-rules';
const safeColumns = 'id,client_id,slot_at,duration_minutes,status,owner_id,meet_link,notes_shared';
export const getClientArea = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  setResponseHeader('Cache-Control','no-store');
  const db = context.supabase;
  const [profile,client,role] = await Promise.all([
    db.from('profiles').select('full_name,is_active').eq('user_id',context.userId).maybeSingle(),
    db.from('clients').select('id').eq('profile_id',context.userId).maybeSingle(),
    db.from('user_roles').select('role').eq('user_id',context.userId).maybeSingle(),
  ]);
  if (profile.error || client.error || role.error) throw new Error('Your account could not load. Please try again.');
  if (profile.data?.is_active === false) throw new Error('This account is inactive. Please contact the team.');
  const bookings = [];
  if (client.data) for (let offset=0; ; offset+=500) {
    const response = await db.from('bookings').select(safeColumns).eq('client_id',client.data.id).order('slot_at',{ascending:false}).range(offset,offset+499);
    if (response.error) throw new Error('Your calls could not load. Please try again.');
    bookings.push(...response.data);
    if (response.data.length<500) break;
  }
  const hosts: Record<string,string> = {};
  await Promise.all(bookings.filter(b => b.owner_id).map(async b => { const result=await db.rpc('client_call_host',{p_booking_id:b.id}); if (typeof result.data==='string') hosts[b.id]=result.data; }));
  return { profile: profile.data, clientId: client.data?.id ?? null, manager: role.data?.role==='owner' || role.data?.role==='manager', bookings, hosts };
});
export const getBookingFiles = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({bookingId:z.string().uuid()})).handler(async ({data,context}) => {
  setResponseHeader('Cache-Control','no-store');
  const response=await context.supabase.from('booking_files').select('id,booking_id,storage_path,original_name,bytes,mime').eq('booking_id',data.bookingId).order('created_at');
  if(response.error) throw new Error('Uploaded files could not load.');
  return Promise.all(response.data.map(async file => { const signed=await context.supabase.storage.from('client-uploads').createSignedUrl(file.storage_path,600); return {...file,url:signed.data?.signedUrl ?? null}; }));
});
export const prepareClientUpload = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({bookingId:z.string().uuid(),name:z.string().min(1).max(200),bytes:z.number().int().min(1).max(maxUploadBytes)})).handler(async ({data,context}) => {
  const db=context.supabase;
  const client=await db.from('clients').select('id').eq('profile_id',context.userId).maybeSingle();
  if(!client.data) throw new Error('No client booking is linked to this account.');
  const booking=await db.from('bookings').select('id,status').eq('id',data.bookingId).eq('client_id',client.data.id).maybeSingle();
  if(!booking.data || booking.data.status==='completed') throw new Error('This booking is not available for uploads.');
  const count=await db.from('booking_files').select('id',{head:true,count:'exact'}).eq('booking_id',data.bookingId);
  if(count.error || (count.count ?? 0)>=5) throw new Error('This booking already has five files.');
  const name=data.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,160);
  const path=`${client.data.id}/${data.bookingId}/${crypto.randomUUID()}-${name}`;
  const upload=await db.storage.from('client-uploads').createSignedUploadUrl(path,{upsert:false});
  if(upload.error) throw new Error('Upload could not start. Please try again.');
  const browserUrl=import.meta.env['VITE_SUPABASE_URL'] as string | undefined;
  const signedUrl=new URL(upload.data.signedUrl);
  if(browserUrl) { const publicUrl=new URL(browserUrl); signedUrl.protocol=publicUrl.protocol; signedUrl.host=publicUrl.host; }
  return {path,signedUrl:signedUrl.href};
});
export const finishClientUpload = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({bookingId:z.string().uuid(),path:z.string().max(500),name:z.string().max(200)})).handler(async ({data,context}) => {
  const db=context.supabase;
  const client=await db.from('clients').select('id').eq('profile_id',context.userId).maybeSingle();
  if(!client.data || !data.path.startsWith(`${client.data.id}/${data.bookingId}/`)) throw new Error('This file does not belong to your booking.');
  const download=await db.storage.from('client-uploads').download(data.path);
  if(download.error || !download.data || download.data.size>maxUploadBytes) throw new Error('File could not be verified, or exceeds 10 MB.');
  const mime=realFileMime(new Uint8Array(await download.data.slice(0,512).arrayBuffer()));
  if(!mime) throw new Error('Choose a real JPG, PNG, WebP, HEIC or PDF file.');
  const result=await db.from('booking_files').insert({booking_id:data.bookingId,storage_path:data.path,original_name:data.name,bytes:download.data.size,mime});
  if(result.error) throw new Error(result.error.message.includes('file_limit_reached')?'This booking already has five files.':'The file uploaded but could not be attached. Retry attaching it; do not upload it again.');
  return {ok:true};
});
export const removeClientFile = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({id:z.string().uuid()})).handler(async ({data,context}) => {
  const db=context.supabase;
  const role=await db.from('user_roles').select('role').eq('user_id',context.userId).maybeSingle();
  if(!['owner','manager'].includes(role.data?.role ?? '')) throw new Error('Only managers can remove files.');
  const file=await db.from('booking_files').select('id,booking_id,storage_path').eq('id',data.id).maybeSingle();
  if(!file.data?.booking_id) throw new Error('File not found.');
  const booking=await db.from('bookings').select('status').eq('id',file.data.booking_id).maybeSingle();
  if(!booking.data || booking.data.status==='completed') throw new Error('Completed call files cannot be removed here.');
  const removed=await db.storage.from('client-uploads').remove([file.data.storage_path]);
  if(removed.error) throw new Error('The file could not be removed.');
  const deleted=await db.from('booking_files').delete().eq('id',file.data.id);
  if(deleted.error) throw new Error('The file entry could not be removed. Please retry.');
  return {ok:true};
});