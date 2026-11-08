import { createServerFn } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { phoneSchema } from './application-rules';
import { documentBucket } from './hiring-journey-rules';
const idSchema=z.object({id:z.string().uuid()});
function checked<T>(r:{data:T;error:{message:string}|null}):T {if(r.error)throw new Error(r.error.message);return r.data;}
export const candidateWorkspace=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
  setResponseHeader('Cache-Control','no-store');const db=context.supabase;
  const candidate=checked(await db.from('candidates').select('*').eq('id',context.userId).maybeSingle());
  const applications=checked(await db.from('applications').select('*').eq('candidate_id',context.userId).order('created_at',{ascending:false})) ?? [];
  const ids=applications.map(a=>a.id),jobsIds=[...new Set(applications.map(a=>a.job_id))];
  const jobs=jobsIds.length?checked(await db.from('jobs').select('id,title,slug,type,work_mode,schedule_text,application_pipeline_id,task_enabled,task_brief,task_due_days').in('id',jobsIds)) ?? []:[];
  const pipes=[...new Set(jobs.map(j=>j.application_pipeline_id))];
  const stages=pipes.length?checked(await db.from('pipeline_stages').select('pipeline_id,key,candidate_label,candidate_description,color,sort_order,expected_days,is_terminal,is_negative').in('pipeline_id',pipes).order('sort_order')) ?? []:[];
  const events=ids.length?checked(await db.from('application_events').select('id,application_id,to_status,from_status,message_to_candidate,reason,created_at').in('application_id',ids).eq('visible_to_candidate',true).order('created_at')) ?? []:[];
  const interviewRows=ids.length?checked(await db.from('candidate_interviews').select('id,application_id,scheduled_at,duration_minutes,mode,meet_link,office_address,status').in('application_id',ids).order('scheduled_at')) ?? []:[];
  const interviews=interviewRows.flatMap(i => i.id && i.application_id && i.scheduled_at && i.duration_minutes !== null ? [{...i,id:i.id,application_id:i.application_id,scheduled_at:i.scheduled_at,duration_minutes:i.duration_minutes}] : []);
  const documents=checked(await db.from('documents').select('id,title,kind,file_path,created_at').eq('candidate_id',context.userId).order('created_at',{ascending:false})) ?? [];
  const {data:contact}=await db.rpc('hiring_candidate_contact');
  const journeys=checked(await db.from('member_journeys').select('id,stage_key,mentor_name').eq('candidate_id',context.userId)) ?? [];
  let photoUrl:string|null=null;if(candidate?.photo_url)photoUrl=(await db.storage.from('task-files').createSignedUrl(candidate.photo_url,300)).data?.signedUrl ?? null;
  return {candidate,applications,jobs,stages,events,interviews,documents,journeys,photoUrl,fromEmail:contact ?? null,userId:context.userId};
});
export type CandidateWorkspace=Awaited<ReturnType<typeof candidateWorkspace>>;
export const candidateTracker=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(idSchema).handler(async({data,context})=>{
  setResponseHeader('Cache-Control','no-store');const db=context.supabase;
  const application=checked(await db.from('applications').select('id,job_id').eq('id',data.id).eq('candidate_id',context.userId).maybeSingle());if(!application)throw new Error('Application not found.');
  const questions=checked(await db.rpc('hiring_candidate_questions',{_application_id:data.id})) ?? [];
  const answers=checked(await db.from('application_answers').select('job_question_id,answer,file_url').eq('application_id',data.id)) ?? [];
  return {questions,answers};
});
export const candidatePdf=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(idSchema).handler(async({data,context})=>{
  setResponseHeader('Cache-Control','no-store');const db=context.supabase;
  const app=checked(await db.from('applications').select('id').eq('id',data.id).eq('candidate_id',context.userId).maybeSingle());if(!app)throw new Error('Application not found.');
  const signed=checked(await db.from('signed_agreements').select('pdf_path').eq('application_id',data.id).maybeSingle());
  const {data:mail}=await db.rpc('hiring_candidate_email_status',{_application_id:data.id});
  if(!signed?.pdf_path)return {url:null,emailStatus:mail ?? null};
  const result=await db.storage.from('agreements').createSignedUrl(signed.pdf_path,300);if(result.error)throw result.error;return {url:result.data.signedUrl,emailStatus:mail ?? null};
});
export const candidateDocument=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(idSchema).handler(async({data,context})=>{
  setResponseHeader('Cache-Control','no-store');const d=checked(await context.supabase.from('documents').select('file_path,kind').eq('id',data.id).eq('candidate_id',context.userId).single());if(!d)throw new Error('Document unavailable.');const r=await context.supabase.storage.from(documentBucket(d.kind)).createSignedUrl(d.file_path,300);if(r.error)throw r.error;return r.data.signedUrl;
});
export const withdrawCandidateApplication=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(idSchema.extend({reason:z.string().max(2000)})).handler(async({data,context})=>{checked(await context.supabase.rpc('withdraw_application',{_application_id:data.id,_reason:data.reason}));return {ok:true};});
export const submitCandidateTask=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(idSchema.extend({url:z.string().url().max(2048).refine(s=>/^https?:\/\//.test(s)),note:z.string().max(500)})).handler(async({data,context})=>{checked(await context.supabase.rpc('hiring_candidate_submit_task',{_application_id:data.id,_url:data.url,_note:data.note}));return {ok:true};});
export const saveCandidateProfile=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({full_name:z.string().trim().min(2).max(100).regex(/^[A-Za-z .'-]+$/),phone:phoneSchema,whatsapp:z.union([phoneSchema,z.literal('')]),area:z.string().trim().min(1).max(150),portfolio_url:z.union([z.string().url().max(2048).refine(s=>/^https?:\/\//.test(s)),z.literal('')]),email_notifications:z.boolean()})).handler(async({data,context})=>{
  checked(await context.supabase.from('candidates').upsert({id:context.userId,...data}));return {ok:true};
});
export const uploadCandidatePhoto=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>{if(!(v instanceof FormData))throw new Error('Invalid photo');return v;}).handler(async({data,context})=>{
  const file=data.get('photo');if(!(file instanceof File)||!file.size||file.size>2097152)throw new Error('Choose an image up to 2 MB.');const bytes=new Uint8Array(await file.arrayBuffer());const png=bytes[0]===137&&bytes[1]===80,jpg=bytes[0]===255&&bytes[1]===216;if(!png&&!jpg)throw new Error('Choose a PNG or JPEG photo.');
  const path=`${context.userId}/profile/photo-${crypto.randomUUID()}.${png?'png':'jpg'}`;
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const r=await supabaseAdmin.storage.from('task-files').upload(path,bytes,{contentType:png?'image/png':'image/jpeg'});if(r.error)throw r.error;
  checked(await context.supabase.from('candidates').update({photo_url:path}).eq('id',context.userId));const signed=await supabaseAdmin.storage.from('task-files').createSignedUrl(path,300);return signed.data?.signedUrl ?? null;
});
export const regenerateHiringPdf=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(idSchema).handler(async({data,context})=>{
  const admin=checked(await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'}));if(!admin)throw new Error('Hiring admin required.');const {generateAgreementPdf}=await import('./hiring-delivery.server');await generateAgreementPdf(data.id);return {ok:true};
});
export const sendHiringEmail=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(idSchema.extend({trigger:z.string().max(80),extra:z.record(z.string(),z.string().max(5000)).default({})})).handler(async({data,context})=>{
  const admin=checked(await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'}));if(!admin)throw new Error('Hiring admin required.');const delivery=await import('./hiring-delivery.server');return delivery.sendHiringEmail(data.trigger,data.id,data.extra);
});
export const hiringChangeStatus=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(idSchema.extend({status:z.string().max(80),message:z.string().max(5000).default(''),reason:z.string().max(2000).default('')})).handler(async({data,context})=>{
  const event=checked(await context.supabase.rpc('change_application_status',{_application_id:data.id,_to_status:data.status,_message:data.message,_reason:data.reason}));
  try{const {deliverStatusEmail}=await import('./hiring-delivery.server');await deliverStatusEmail(data.id,data.status,data.message,data.reason);}catch{console.error('Hiring status email failed');}return {event};
});