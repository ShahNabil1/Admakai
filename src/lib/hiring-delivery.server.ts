import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { supabaseAdmin as db } from '@/integrations/supabase/client.server';
import { latinFont, bengaliFont } from './hiring-fonts.server';
import { dhakaDate, shouldSendHiringEmail, taskDueAt } from './candidate-rules';
import { fillAgreement } from './application-rules';
import emailLogo from '@/assets/brand/logo-dark-cropped.png.asset.json';

function required<T>(r: {data:T;error:{message:string}|null}): NonNullable<T> { if(r.error || r.data == null) throw new Error(r.error?.message ?? 'Hiring record unavailable'); return r.data; }
export async function hiringDeliveryContext(id: string) {
  const app=required(await db.from('applications').select('*').eq('id',id).single());
  const [c,j,p,s]=await Promise.all([db.from('candidates').select('*').eq('id',app.candidate_id).single(),db.from('jobs').select('*').eq('id',app.job_id).single(),db.from('profiles').select('email').eq('user_id',app.candidate_id).single(),db.from('hiring_settings').select('*').single()]);
  return {app,candidate:required(c),job:required(j),profile:required(p),settings:required(s)};
}
export async function generateAgreementPdf(id: string) {
  const {app,candidate,job,profile,settings}=await hiringDeliveryContext(id);
  if(app.is_draft) throw new Error('Submit your application first.');
  const signed=required(await db.from('signed_agreements').select('*').eq('application_id',id).single());
  const template=required(await db.from('agreement_templates').select('*').eq('id',signed.template_id).eq('version',signed.template_version).single());
  const doc=await PDFDocument.create(); doc.registerFontkit(fontkit);
  const bytes=(s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
  const latin=await doc.embedFont(bytes(latinFont),{subset:true}), bengali=await doc.embedFont(bytes(bengaliFont),{subset:true});
  const ink=rgb(.07,.07,.07), muted=rgb(.4,.4,.4);
  let page:PDFPage=doc.addPage([595.28,841.89]), y=785;
  const newPage=()=>{page=doc.addPage([595.28,841.89]);y=785;};
  const choose=(s:string):PDFFont=>/[\u0980-\u09ff]/.test(s)?bengali:latin;
  function line(text:string,size=10) {
    const font=choose(text); const safe=[...text].map(c=>font.getCharacterSet().includes(c.codePointAt(0) ?? 0)?c:'?').join('');
    const words=safe.split(/\s+/); let row='';
    const draw=()=>{if(y<75)newPage();page.drawText(row,{x:48,y,size,font,color:ink});y-=size*1.65;row='';};
    for(const word of words){ const test=row?`${row} ${word}`:word; if(font.widthOfTextAtSize(test,size)>499 && row)draw(); if(font.widthOfTextAtSize(word,size)>499){for(const c of word){if(font.widthOfTextAtSize(row+c,size)>499)draw();row+=c;}}else row+=(row?' ':'')+word; } if(row)draw(); y-=4;
  }
  async function image(bucket:string,path:string|null,width:number,height:number) {
    if(!path)return false;
    let storagePath=path;
    if(/^https:\/\//.test(path)){const m=path.match(/\/storage\/v1\/object\/(?:sign|public)\/hiring-assets\/([^?]+)/);if(!m)return false;storagePath=decodeURIComponent(m[1] ?? '');}
    const r=await db.storage.from(bucket).download(storagePath);if(r.error||!r.data)return false;
    const b=new Uint8Array(await r.data.arrayBuffer());const png=b[0]===137;const img=png?await doc.embedPng(b):await doc.embedJpg(b);const scale=Math.min(width/img.width,height/img.height);
    if(y<height+80)newPage();page.drawImage(img,{x:48,y:y-height,width:img.width*scale,height:img.height*scale});y-=height+10;return true;
  }
  await image('hiring-assets',settings.pdf_logo_url,130,45);
  line('Admakai',22);if(settings.company_address)line(settings.company_address);y-=12;
  line('Application Agreement',18);line(`${app.public_code} · ${dhakaDate(signed.signed_at)}`);y-=12;
  line('Candidate details',13);line(`Name: ${signed.signer_full_name}`);line(`Email: ${profile.email}`);line(`Phone: ${candidate.phone ?? 'Not provided'}`);line(`Area: ${candidate.area ?? 'Not provided'}`);y-=10;
  line('Job details',13);line(job.title,12);line(`${job.type} · ${job.work_mode}`);if(job.schedule_text)line(job.schedule_text);y-=12;
  const body=fillAgreement(template.body,signed.signer_full_name,job.title,app.public_code,new Date(signed.signed_at));
  for(const paragraph of body.split('\n'))line(paragraph.replace(/^#{1,6}\s*/,'').replace(/\*\*/g,''),paragraph.startsWith('#')?13:10);
  line('Accepted key terms',13);
  for(const term of Array.isArray(signed.accepted_terms)?signed.accepted_terms:[]){if(typeof term==='string'){if(y<100)newPage();page.drawLine({start:{x:48,y:y-3},end:{x:51,y:y-6},thickness:1,color:ink});page.drawLine({start:{x:51,y:y-6},end:{x:58,y:y+2},thickness:1,color:ink});line(`    ${term}`);}}
  y-=14;line('Candidate signature',13);if(!await image('signatures',signed.signature_path,230,70))throw new Error('Candidate signature image unavailable');line(signed.signer_full_name,12);line(`Signed: ${dhakaDate(signed.signed_at,true)} (Asia/Dhaka)`);line(`IP address: ${signed.ip_address ?? 'Not recorded'}`);line(`Template: ${template.name} · Version ${signed.template_version}`);
  if(settings.authorised_signature_url){y-=12;line('For Admakai',13);await image('hiring-assets',settings.authorised_signature_url,180,65);}
  const pages=doc.getPages();pages.forEach((p,i)=>p.drawText(`Electronically signed via admakai.com · Page ${i+1} of ${pages.length}`,{x:48,y:35,size:8,font:latin,color:muted}));
  const pdf=await doc.save();const digest=await crypto.subtle.digest('SHA-256',new Uint8Array(pdf));const hash=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
  const path=`${app.candidate_id}/${app.id}/agreement-${app.public_code}.pdf`;
  const upload=await db.storage.from('agreements').upload(path,pdf,{contentType:'application/pdf',upsert:true});if(upload.error)throw upload.error;
  const update=await db.from('signed_agreements').update({pdf_path:path,pdf_sha256:hash}).eq('id',signed.id);if(update.error)throw update.error;
  const existing=await db.from('documents').select('id').eq('candidate_id',app.candidate_id).eq('file_path',path).maybeSingle();if(existing.error)throw existing.error;
  if(!existing.data){const r=await db.from('documents').insert({candidate_id:app.candidate_id,kind:'agreement',title:`Application agreement · ${job.title}`,file_path:path});if(r.error)throw r.error;}
  return path;
}
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] ?? c));
export async function sendHiringEmail(trigger:string,id:string,extra:Record<string,string>={},extraAttachments:Array<{filename:string;content:string}>=[]) {
  const {app,candidate,job,profile,settings}=await hiringDeliveryContext(id);
  const template=required(await db.from('email_templates').select('*').eq('trigger_key',trigger).single());
  const admin=trigger==='admin_new_application';const recipients=admin?settings.notify_admin_emails:[profile.email];
  const tracker=`https://admakai.com/me/applications/${app.id}`;
  const values:Record<string,string>={...extra,candidate_name:candidate.full_name,job_title:job.title,application_code:app.public_code,tracker_link:tracker,status_message:extra['status_message'] ?? ''};
  const fill=(s:string)=>s.replace(/{{\s*([a-z_]+)\s*}}/g,(_,key:string)=>values[key] ?? '');
  const results:Array<{status:string}>=[];
  for(const to of recipients){let status='skipped',error:string|null=null,providerId:string|null=null;
    if(shouldSendHiringEmail(trigger,template.is_enabled,candidate.email_notifications)&&process.env['RESEND_API_KEY']){
      try{let content=fill(template.body);if(admin)content+=`\nCandidate: ${candidate.full_name}\nJob: ${job.title}\nKnockout flags: ${extra['knockout_flags'] ?? 'None'}\nhttps://admakai.com/admin/hiring/jobs`;
        const button=admin?'https://admakai.com/admin/hiring/jobs':tracker;
        const html=`<!doctype html><html><body style="background:#f6f6f6;color:#111;font-family:Arial,sans-serif;margin:0;padding:32px"><div style="max-width:560px;margin:auto"><img src="https://admakai.com${emailLogo.url}" alt="Admakai" width="160"><h1 style="font-size:24px">${escape(fill(template.subject))}</h1><p style="line-height:1.7;white-space:pre-line">${escape(content)}</p><a href="${button}" style="display:inline-block;background:#111;color:#fff;padding:14px 22px;text-decoration:none">${admin?'Review applications':'Track your application'}</a><p style="font-size:12px;color:#666;margin-top:32px">Admakai<br>${escape(settings.company_address ?? '')}</p></div></body></html>`;
        const attachments:Array<{filename:string;content:string}>=[...extraAttachments];
        if(trigger==='application_submitted'){
          const agreement=await db.from('signed_agreements').select('pdf_path').eq('application_id',id).maybeSingle();
          if(agreement.data?.pdf_path){const file=await db.storage.from('agreements').download(agreement.data.pdf_path);if(file.data){const bytes=new Uint8Array(await file.data.arrayBuffer());let binary='';for(const b of bytes)binary+=String.fromCharCode(b);attachments.push({filename:`agreement-${app.public_code}.pdf`,content:btoa(binary)});}}
        }
        const response=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(15000),headers:{Authorization:`Bearer ${process.env['RESEND_API_KEY']}`,'Content-Type':'application/json'},body:JSON.stringify({from:settings.from_email,to:[to],...(settings.reply_to?{reply_to:settings.reply_to}:{}),subject:fill(template.subject),html,text:`${content}\n\n${button}\n\nAdmakai\n${settings.company_address ?? ''}`,...(attachments.length?{attachments}: {})})});
        if(!response.ok){const body=await response.json().catch(()=>({}));throw new Error(`Resend ${response.status}: ${typeof body.message==='string'?body.message.slice(0,300):'Delivery rejected'}`);}const body=await response.json();providerId=body.id ?? null;status='sent';
      }catch(e){status='failed';error=e instanceof Error?e.message:'Email delivery failed';}
    }
    const r=await db.from('email_log').insert({application_id:id,to_email:to,trigger_key:trigger,status,provider_id:providerId,error});if(r.error)throw r.error;results.push({status});
  }return results;
}
export async function deliverSubmittedApplication(id:string){
  const outcome={pdf:'failed',email:'failed'};
  try{await generateAgreementPdf(id);outcome.pdf='ready';}catch{console.error('Hiring agreement generation failed');}
  try{const {data:reviews}=await db.from('application_reviews').select('knockout_flags').eq('application_id',id);const results=await sendHiringEmail('application_submitted',id);await sendHiringEmail('admin_new_application',id,{knockout_flags:JSON.stringify(reviews?.map(r=>r.knockout_flags) ?? [])});outcome.email=results[0]?.status ?? 'skipped';}catch{console.error('Hiring submission email delivery failed');}
  return outcome;
}
export async function deliverStatusEmail(id:string,status:string,message:string,reason:string){
  const {job}=await hiringDeliveryContext(id);const {data:stage}=await db.from('pipeline_stages').select('sends_email').eq('pipeline_id',job.application_pipeline_id).eq('key',status).single();
  if(!stage?.sends_email||!['in_review','shortlisted','rejected','selected','offer','hired','interview_scheduled'].includes(status))return;
  const extra:Record<string,string>={status_message:status==='rejected'?`${message}\n${reason}`:message,reason};if(status==='shortlisted'){extra['task_brief']=job.task_brief ?? '';extra['task_due_date']=dhakaDate(taskDueAt(new Date().toISOString(),job.task_due_days ?? 3),true);extra['status_message']=`${message}\n${extra['task_brief']}\nDue: ${extra['task_due_date']}`;}await sendHiringEmail(status,id,extra);
}