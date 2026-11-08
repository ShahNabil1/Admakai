import {createServerFn} from '@tanstack/react-start';
import {setResponseHeader} from '@tanstack/react-start/server';
import {requireSupabaseAuth} from '@/integrations/supabase/auth-middleware';
import {z} from 'zod';
import {canMoveHiring} from './hiring-review-rules';
const checked=<T,>(r:{data:T;error:{message:string}|null})=>{if(r.error)throw new Error(r.error.message);return r.data;};
const id=z.string().uuid();
export type DeliveryRow={id:string;kind:string;trigger_key:string;status:string;attempts:number;last_error:string|null;created_at:string;sent_at:string|null;journey_id?:string|null};
export const hiringReviewWorkspace=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 setResponseHeader('Cache-Control','no-store');const db=context.supabase;
 const roles=checked(await db.from('hiring_user_roles').select('role').eq('user_id',context.userId))?.map(r=>r.role)??[];
 if(!roles.length)throw new Error('Hiring access required');
 const applications=[] as import('@/integrations/supabase/types').Database['public']['Tables']['applications']['Row'][];
 for(let offset=0;;offset+=1000){const rows=checked(await db.from('applications').select('*').order('created_at',{ascending:false}).range(offset,offset+999))??[];applications.push(...rows);if(rows.length<1000)break;}
 const ids=applications.map(a=>a.id),candidateIds=[...new Set(applications.map(a=>a.candidate_id))];
 const [c,j,s,p,r,e,i,staff]=await Promise.all([candidateIds.length?db.from('candidates').select('*').in('id',candidateIds):Promise.resolve({data:[],error:null}),db.from('jobs').select('*'),db.from('pipeline_stages').select('*').order('sort_order'),db.from('pipelines').select('*'),ids.length?db.from('application_reviews').select('*').in('application_id',ids):Promise.resolve({data:[],error:null}),ids.length?db.from('application_events').select('*').in('application_id',ids).order('created_at'):Promise.resolve({data:[],error:null}),db.from('interviews').select('*').order('scheduled_at'),db.rpc('list_hiring_staff')]);
 const contacts=candidateIds.length?checked(await db.rpc('hiring_staff_contacts',{_ids:candidateIds}))??[]:[];
 const failed=await db.from('delivery_outbox' as never).select('id',{count:'exact',head:true}).eq('status' as never,'failed').not('application_id' as never,'is',null);const failedDeliveries=failed.error?null:failed.count??0;
 return {failedDeliveries,roles,userId:context.userId,applications,candidates:checked(c)??[],contacts,jobs:checked(j)??[],stages:checked(s)??[],pipelines:checked(p)??[],reviews:checked(r)??[],events:checked(e)??[],interviews:checked(i)??[],staff:checked(staff)??[]};
});
export type HiringReviewData=Awaited<ReturnType<typeof hiringReviewWorkspace>>;
export const hiringApplicant=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({id})).handler(async({data,context})=>{
 setResponseHeader('Cache-Control','no-store');const db=context.supabase;
 if(!checked(await db.rpc('is_hiring_staff',{_user_id:context.userId})))throw new Error('Hiring access required');
 const a=checked(await db.from('applications').select('*').eq('id',data.id).single());if(!a)throw new Error('Applicant unavailable');
 const [answers,questions,notes,signed,emails]=await Promise.all([db.from('application_answers').select('*').eq('application_id',a.id),db.from('job_questions').select('*,question_bank(label,help_text)').eq('job_id',a.job_id).order('sort_order'),db.from('internal_notes').select('*').eq('application_id',a.id).order('created_at',{ascending:false}),db.from('signed_agreements').select('*').eq('application_id',a.id).maybeSingle(),db.from('email_log').select('*').eq('application_id',a.id).order('created_at')]);
 const deliveries=(checked(await db.from('delivery_outbox' as never).select('id,kind,trigger_key,status,attempts,last_error,created_at,sent_at').eq('application_id' as never,a.id).order('created_at' as never)) as unknown as DeliveryRow[]|null)??[];
 const editions=checked(await db.from('application_pdf_versions').select('id,file_path,status_label,created_at,pdf_sha256').eq('application_id',a.id).order('created_at',{ascending:false}))??[];
 const signedRow=checked(signed);const agreement=signedRow?{...signedRow,ip_address:typeof signedRow.ip_address==='string'?signedRow.ip_address:null}:null;const urls:Record<string,string>={};
 // RLS proved staff access to this application before privileged file signing.
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
 for(const [key,bucket,path] of [['cv','resumes',a.cv_path],['signature','signatures',agreement?.signature_path],['pdf','agreements',agreement?.pdf_path]] as const){if(path){const url=await supabaseAdmin.storage.from(bucket).createSignedUrl(path,300);if(url.error)throw url.error;urls[key]=url.data.signedUrl;}}
 const candidate=checked(await db.from('candidates').select('photo_url').eq('id',a.candidate_id).single());if(candidate?.photo_url){const photo=await supabaseAdmin.storage.from('task-files').createSignedUrl(candidate.photo_url,300);if(photo.data)urls['photo']=photo.data.signedUrl;}
 const pdfVersions=await Promise.all(editions.map(async v=>({...v,url:(await supabaseAdmin.storage.from('agreements').createSignedUrl(v.file_path,300)).data?.signedUrl??null})));
 if(pdfVersions[0]?.url){if(urls['pdf'])pdfVersions.push({id:'original',file_path:agreement?.pdf_path??'',status_label:'Original signed document',created_at:'',pdf_sha256:agreement?.pdf_sha256??'',url:urls['pdf']});urls['pdf']=pdfVersions[0].url;}
 const template=agreement?checked(await supabaseAdmin.from('agreement_templates').select('name,version').eq('id',agreement.template_id).eq('version',agreement.template_version).single()):null;
 const authorIds=[...new Set((checked(notes)??[]).map(n=>n.author_id))];const authors=authorIds.length?checked(await db.rpc('hiring_staff_contacts',{_ids:authorIds}))??[]:[];
 return {pdfVersions:pdfVersions.slice(1),deliveries,answers:checked(answers)??[],questions:checked(questions)??[],notes:checked(notes)??[],agreement,emails:checked(emails)??[],urls,template,authors};
});
export type HiringApplicantData=Awaited<ReturnType<typeof hiringApplicant>>;
export const moveHiringApplicant=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({ids:z.array(id).min(1).max(100),status:z.string().min(1).max(80),message:z.string().max(5000),reason:z.string().max(2000)})).handler(async({data,context})=>{
 const roles=checked(await context.supabase.from('hiring_user_roles').select('role').eq('user_id',context.userId))?.map(r=>r.role)??[];if(!canMoveHiring(roles,data.status))throw new Error('This stage is outside your permissions');
 const results=[];const deliveries:string[]=[];for(const application of data.ids){const event=checked(await context.supabase.rpc('change_application_status',{_application_id:application,_to_status:data.status,_message:data.message,_reason:data.reason}));results.push(event);let delivery='none';try{const {deliverStatusEmail}=await import('./hiring-delivery.server');const r=await deliverStatusEmail(application,data.status,data.message,data.reason,String(event));delivery=r?(r.failed?'failed':r.pending?'queued':'sent'):'none';}catch(e){delivery='failed';console.error('Hiring status delivery could not be queued',e);}deliveries.push(delivery);}return Object.assign(results,{deliveries});
});
export const saveHiringRating=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({id,skill:z.number().int().min(1).max(5),thinking:z.number().int().min(1).max(5),commitment:z.number().int().min(1).max(5)})).handler(async({data,context})=>{checked(await context.supabase.rpc('hiring_save_review',{_application_id:data.id,_skill:data.skill,_thinking:data.thinking,_commitment:data.commitment}));return {ok:true};});
export const assignHiringReviewer=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({ids:z.array(id).min(1).max(100),reviewer:id})).handler(async({data,context})=>{checked(await context.supabase.rpc('hiring_assign_reviewer',{_ids:data.ids,_reviewer:data.reviewer}));return {ok:true};});
export const addHiringNote=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({id,body:z.string().trim().min(1).max(5000)})).handler(async({data,context})=>{checked(await context.supabase.from('internal_notes').insert({application_id:data.id,author_id:context.userId,body:data.body}));return {ok:true};});
export const scheduleHiringInterview=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({id,at:z.string().datetime(),duration:z.number().int().min(5).max(240),mode:z.enum(['meet','office']),meet:z.string().max(2048),office:z.string().max(2000),interviewer:id,message:z.string().max(5000)})).handler(async({data,context})=>{
 const result=checked(await context.supabase.rpc('schedule_interview',{_application_id:data.id,_scheduled_at:data.at,_duration_minutes:data.duration,_mode:data.mode,_meet_link:data.meet,_office_address:data.office,_interviewer_id:data.interviewer,_message:data.message}));try{const {deliverInterviewEmail}=await import('./hiring-interviews.server');if(result)await deliverInterviewEmail(result,'interview_scheduled',data.message,String(result));}catch{console.error('Interview email failed');}return result;
});
export const editHiringInterview=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({id,action:z.enum(['reschedule','cancel','result']),at:z.string().optional(),message:z.string().max(5000).default(''),score:z.number().int().min(1).max(5).default(3),strengths:z.string().max(5000).default(''),concerns:z.string().max(5000).default(''),recommendation:z.enum(['select','reject','another_round']).default('another_round')})).handler(async({data,context})=>{
 const db=context.supabase;
 if(data.action==='result')checked(await db.rpc('save_interview_result',{_interview_id:data.id,_score:data.score,_strengths:data.strengths,_concerns:data.concerns,_recommendation:data.recommendation}));
 else if(data.action==='cancel')checked(await db.rpc('cancel_interview',{_interview_id:data.id,_reason:data.message}));
 else {const at=z.string().datetime().parse(data.at);checked(await db.rpc('reschedule_interview',{_interview_id:data.id,_scheduled_at:at,_message:data.message}));}
 if(data.action!=='result'){try{const {deliverInterviewEmail}=await import('./hiring-interviews.server');await deliverInterviewEmail(data.id,data.action==='cancel'?'interview_cancelled':'interview_rescheduled',data.message);}catch{console.error('Interview email failed');}}return {ok:true};
});
export const sendHiringReminders=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).handler(async({context})=>{if(!checked(await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'})))throw new Error('Hiring admin required');const {sendAllReminders}=await import('./crm-emails.server');return sendAllReminders();});