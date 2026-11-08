import { renderDeclarationPdf, pdfHash, type DeclarationSnapshot } from './declaration-pdf.server';
import { supabaseAdmin as db } from '@/integrations/supabase/client.server';
import { dhakaDate, shouldSendHiringEmail, taskDueAt } from './candidate-rules';
import { hiringEmailHtml } from './hiring-email-design';
import { enqueue, processOutbox, type OutboxAttachment, type OutboxMessage } from './outbox.server';

function required<T>(r: {data:T;error:{message:string}|null}): NonNullable<T> { if(r.error || r.data == null) throw new Error(r.error?.message ?? 'Hiring record unavailable'); return r.data; }
export async function hiringDeliveryContext(id: string) {
  const app=required(await db.from('applications').select('*').eq('id',id).single());
  const [c,j,p,s]=await Promise.all([db.from('candidates').select('*').eq('id',app.candidate_id).single(),db.from('jobs').select('*').eq('id',app.job_id).single(),db.from('profiles').select('email').eq('user_id',app.candidate_id).single(),db.from('hiring_settings').select('*').single()]);
  return {app,candidate:required(c),job:required(j),profile:required(p),settings:required(s)};
}
export async function snapshotAgreement(id:string):Promise<DeclarationSnapshot> {
  const context=await hiringDeliveryContext(id);if(context.app.is_draft)throw new Error('Submit your application first.');
  const signed=required(await db.from('signed_agreements').select('*').eq('application_id',id).single());
  const template=required(await db.from('agreement_templates').select('*').eq('id',signed.template_id).eq('version',signed.template_version).single());
  const answers=required(await db.from('application_answers').select('answer,job_questions(label_override,question_bank(label))').eq('application_id',id));
  return {...context,signed,template,answers:answers.map(a=>({label:a.job_questions?.label_override??a.job_questions?.question_bank?.label??'',answer:a.answer}))};
}
export type AgreementEditionPayload={application_id:string;snapshot?:DeclarationSnapshot;status_key?:string;status_label?:string;status_color?:string;edition_at?:string};
export async function generateAgreementPdf(id:string,payload?:AgreementEditionPayload,eventId=id) {
  const existing=await db.from('application_pdf_versions').select('file_path').eq('application_id',id).eq('event_id',eventId).maybeSingle();if(existing.error)throw existing.error;if(existing.data)return existing.data.file_path;
  // Freeze every non-status value from the earliest successful edition, never current editable profiles/settings.
  const earlier=await db.from('delivery_outbox').select('payload').eq('application_id',id).eq('kind','agreement_pdf').eq('status','sent').not('payload->snapshot->images','is',null).order('created_at').limit(1).maybeSingle();
  const previous=earlier.data?.payload as unknown as AgreementEditionPayload|undefined;
  const snap=previous?.snapshot?.images?previous.snapshot:payload?.snapshot??await snapshotAgreement(id);
  if(!snap.images?.logo||!snap.images.passport||!snap.images.applicant||!snap.images.authorised){
    const current=await hiringDeliveryContext(id);
    // Missing setup may be supplied before the first successful PDF; successful editions are never rebranded.
    if(!snap.settings.pdf_logo_url)snap.settings.pdf_logo_url=current.settings.pdf_logo_url;
    if(!snap.settings.authorised_signature_url)snap.settings.authorised_signature_url=current.settings.authorised_signature_url;
    const image=async(bucket:string,path:string|null|undefined)=>{if(!path)return '';let p=path;if(/^https:\/\//.test(p)){const match=p.match(/\/storage\/v1\/object\/(?:sign|public)\/hiring-assets\/([^?]+)/);if(!match)return '';p=decodeURIComponent(match[1]??'');}const r=await db.storage.from(bucket).download(p);if(!r.data)return '';const bytes=new Uint8Array(await r.data.arrayBuffer());let out='';for(let i=0;i<bytes.length;i+=32768)out+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(out);};
    const [logo,passport,applicant,authorised]=await Promise.all([image('hiring-assets',snap.settings.pdf_logo_url),image('task-files',snap.app.passport_photo_path),image('signatures',snap.signed.signature_path),image('hiring-assets',snap.settings.authorised_signature_url)]);snap.images={logo,passport,applicant,authorised};
  }
  if(payload)payload.snapshot=snap;
  const {app,job}=await hiringDeliveryContext(id);
  const stage=await db.from('pipeline_stages').select('candidate_label,color').eq('pipeline_id',job.application_pipeline_id).eq('key',payload?.status_key??app.status_key).maybeSingle();
  const statusKey=payload?.status_key??app.status_key,statusLabel=payload?.status_label??stage.data?.candidate_label??statusKey;
  if(payload){payload.status_key=statusKey;payload.status_label=statusLabel;payload.status_color??=stage.data?.color??'#444444';}
  const rendered=await renderDeclarationPdf(snap,statusLabel,payload?.status_color??stage.data?.color??'#444444');
  const hash=await pdfHash(rendered.bytes),path=`${app.candidate_id}/${app.id}/declaration-${eventId}-${hash.slice(0,12)}.pdf`;
  const upload=await db.storage.from('agreements').upload(path,rendered.bytes,{contentType:'application/pdf',upsert:false});if(upload.error){const stored=await db.storage.from('agreements').download(path);if(!stored.data||await pdfHash(new Uint8Array(await stored.data.arrayBuffer()))!==hash)throw upload.error;}
  const insert=await db.from('application_pdf_versions').insert({application_id:id,event_id:eventId,template_id:snap.signed.template_id,template_version:snap.signed.template_version,status_key:statusKey,status_label:statusLabel,file_path:path,pdf_sha256:hash,document_id:rendered.documentId,created_at:payload?.edition_at??new Date().toISOString()});if(insert.error)throw insert.error;
  // Preserve signed_agreements.pdf_path/pdf_sha256 and every previously uploaded original.
  const doc=await db.from('documents').select('id').eq('candidate_id',app.candidate_id).eq('kind','agreement').maybeSingle();if(!doc.data){const r=await db.from('documents').insert({candidate_id:app.candidate_id,kind:'agreement',title:`Application declaration · ${snap.job.title}`,file_path:path});if(r.error)throw r.error;}
  return path;
}

/** Renders a hiring template for its recipients now, so the stored snapshot is what gets sent later. */
export async function renderHiringEmail(trigger:string,id:string,extra:Record<string,string>={},recipient?:string):Promise<OutboxMessage[]>{
  const {app,candidate,job,profile,settings}=await hiringDeliveryContext(id);
  const template=required(await db.from('email_templates').select('*').eq('trigger_key',trigger).single());
  const admin=trigger==='admin_new_application';const recipients=recipient?[recipient]:admin?settings.notify_admin_emails:[profile.email];
  const tracker=`https://admakai.com/dashboard/applications/${app.id}`;
  const values:Record<string,string>={...extra,candidate_name:candidate.full_name,job_title:job.title,application_code:app.public_code,tracker_link:extra['tracker_link'] ?? tracker,status_message:extra['status_message'] ?? ''};
  const fill=(s:string)=>s.replace(/{{\s*([a-z_]+)\s*}}/g,(_,key:string)=>values[key] ?? '');
  let content=fill(template.body);if(extra['interview_details']&&!content.includes(extra['interview_details']))content+=`\n${extra['interview_details']}`;if(admin)content+=`\nCandidate: ${candidate.full_name}\nJob: ${job.title}\nKnockout flags: ${extra['knockout_flags'] ?? 'None'}\nhttps://admakai.com/admin/hiring/jobs`;
  const button=admin?'https://admakai.com/admin/hiring/jobs':tracker;const subject=fill(template.subject);
  const skip=shouldSendHiringEmail(trigger,template.is_enabled,candidate.email_notifications)?null:'Template disabled or candidate opted out';
  return (recipients??[]).filter(Boolean).map(to=>({to,from:settings.from_email,reply_to:settings.reply_to,subject,html:hiringEmailHtml(subject,content,button,settings.company_address ?? '',admin),text:`${content}\n\n${button}\n\nAdmakai\n${settings.company_address ?? ''}`,skip}));
}
/** Queues a hiring email snapshot in the outbox, then tries to send it straight away. */
export async function sendHiringEmail(trigger:string,id:string,extra:Record<string,string>={},attachments:OutboxAttachment[]=[],opts:{eventId:string;journeyId?:string|null;waitFor?:string[];recipient?:string;process?:boolean}){
  const messages=await renderHiringEmail(trigger,id,extra,opts.recipient);
  const outboxId=await enqueue({kind:'email',trigger_key:trigger,event_id:opts.eventId,application_id:id,journey_id:opts.journeyId ?? null,payload:{messages,attachments,wait_for:opts.waitFor ?? []}});
  if(opts.process===false)return {outboxId,status:'pending'};
  const r=await processOutbox([outboxId]);return {outboxId,status:r.statuses[outboxId] ?? 'pending'};
}
export async function deliverSubmittedApplication(id:string){
  const {app}=await hiringDeliveryContext(id);
  const pdf=await enqueue({kind:'agreement_pdf',trigger_key:'agreement',event_id:id,application_id:id,payload:{application_id:id,snapshot:await snapshotAgreement(id),status_key:app.status_key}});
  const {data:reviews}=await db.from('application_reviews').select('knockout_flags').eq('application_id',id);
  const candidate=await sendHiringEmail('application_submitted',id,{},[{filename:`agreement-${app.public_code}.pdf`,from_outbox:pdf}],{eventId:id,waitFor:[pdf],process:false});
  const admin=await sendHiringEmail('admin_new_application',id,{knockout_flags:JSON.stringify(reviews?.map(r=>r.knockout_flags) ?? [])},[],{eventId:id,process:false});
  const r=await processOutbox([pdf,candidate.outboxId,admin.outboxId]);
  const pdfStatus=r.statuses[pdf],mail=r.statuses[candidate.outboxId];
  return {pdf:pdfStatus==='sent'?'ready':pdfStatus==='failed'?'failed':'queued',email:mail==='sent'?'sent':mail==='failed'?'failed':'queued',queued:true};
}
export async function deliverStatusEmail(id:string,status:string,message:string,reason:string,eventId:string){
  const {job}=await hiringDeliveryContext(id);
  const pdfRows=await db.from('delivery_outbox').select('id').eq('application_id',id).eq('kind','agreement_pdf').eq('status','pending');
  const pdfIds=(pdfRows.data??[]).map(r=>r.id);if(pdfIds.length)await processOutbox(pdfIds);
  const attachments:OutboxAttachment[]=[];const waitFor:string[]=[];
  if(status==='offer'){const {snapshotLetter}=await import('./hiring-letters.server');const snap=await snapshotLetter(id,'offer');const letter=await enqueue({kind:'offer_letter',trigger_key:'offer',event_id:eventId,application_id:id,payload:snap});waitFor.push(letter);attachments.push({filename:`admakai-offer-${snap.values.application_code}.pdf`,from_outbox:letter});}
  const {data:stage}=await db.from('pipeline_stages').select('sends_email').eq('pipeline_id',job.application_pipeline_id).eq('key',status).single();
  if(!stage?.sends_email||!['in_review','shortlisted','rejected','selected','offer','hired','interview_scheduled'].includes(status)){if(waitFor.length)return processOutbox(waitFor);return null;}
  const extra:Record<string,string>={status_message:status==='rejected'?`${message}\n${reason}`:message,reason};if(status==='shortlisted'){extra['task_brief']=job.task_brief ?? '';extra['task_due_date']=dhakaDate(taskDueAt(new Date().toISOString(),job.task_due_days ?? 3),true);extra['status_message']=`${message}\n${extra['task_brief']}\nDue: ${extra['task_due_date']}`;}
  const mail=await sendHiringEmail(status,id,extra,attachments,{eventId,waitFor,process:false});return processOutbox([...waitFor,mail.outboxId]);
}
