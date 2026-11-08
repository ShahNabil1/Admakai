import {PDFDocument,rgb} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {supabaseAdmin as db} from '@/integrations/supabase/client.server';
import {latinFont,bengaliFont} from './hiring-fonts.server';
import {hiringDeliveryContext,sendHiringEmail} from './hiring-delivery.server';
import {enqueue,processOutbox,type OutboxAttachment} from './outbox.server';
import {fillHiringTemplate,previewValues} from './hiring-journey-rules';
import {dhakaDate} from './candidate-rules';
import {hiringEmailHtml} from './hiring-email-design';
const checked=<T>(r:{data:T;error:{message:string}|null})=>{if(r.error||!r.data)throw new Error(r.error?.message??'Hiring record unavailable');return r.data;};
export type LetterSnapshot={application_id:string;candidate_id:string;kind:'offer'|'promotion';template_id:string;version:number;body:string;stage_key:string;stage_label:string|null;job_title:string;logo:string|null;signature:string|null;address:string|null;values:{candidate_name:string;job_title:string;stage_name:string;start_date:string;date:string;application_code:string}};
/** Captures every value the letter needs at the moment of the change, so a later retry prints exactly this letter. */
export async function snapshotLetter(application:string,kind:'offer'|'promotion',journey?:string,startDate?:string):Promise<LetterSnapshot>{
 const {app,candidate,job,settings}=await hiringDeliveryContext(application);if(app.is_draft)throw new Error('Submit the application first');
 const template=checked(await db.from('letter_templates').select('*').eq('kind',kind).eq('is_current',true).single());
 if(template.legal_review_pending)throw new Error('Approve the letter template after legal review before generating letters.');
 const j=journey?checked(await db.from('member_journeys').select('*').eq('id',journey).eq('application_id',application).single()):null;
 if(kind==='promotion'&&!j)throw new Error('Choose the member journey');
 const stage=j?checked(await db.from('pipeline_stages').select('candidate_label').eq('pipeline_id',j.pipeline_id).eq('key',j.stage_key).single()):null;
 const now=new Date().toISOString();
 return {application_id:app.id,candidate_id:app.candidate_id,kind,template_id:template.id,version:template.version,body:template.body,stage_key:j?.stage_key??'offer',stage_label:stage?.candidate_label??null,job_title:job.title,logo:settings.pdf_logo_url,signature:settings.authorised_signature_url,address:settings.company_address,values:{candidate_name:candidate.full_name,job_title:job.title,stage_name:stage?.candidate_label??'Offer',start_date:dhakaDate(startDate??j?.stage_started_at??now),date:dhakaDate(now),application_code:app.public_code}};
}
/** Builds the PDF from a snapshot. The same key always writes the same file and document row. */
export async function buildLetter(snap:LetterSnapshot,key:string){
 const text=fillHiringTemplate(snap.body,snap.values);const kind=snap.kind;
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const decode=(s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));const latin=await pdf.embedFont(decode(latinFont),{subset:true}),bengali=await pdf.embedFont(decode(bengaliFont),{subset:true});let page=pdf.addPage([595.28,841.89]),y=780;
 const line=(text:string,size=11)=>{const font=/[\u0980-\u09ff]/.test(text)?bengali:latin;let row='';const draw=()=>{if(y<90){page=pdf.addPage([595.28,841.89]);y=780;}page.drawText(row,{x:48,y,size,font,color:rgb(.07,.07,.07)});y-=size*1.7;row='';};for(const c of text.replace(/\*\*/g,'').replace(/^#+\s*/,'')){if(font.widthOfTextAtSize(row+c,size)>490)draw();row+=c;}if(row)draw();y-=8;};
 async function image(path:string|null,w:number,h:number){if(!path||/^https?:/.test(path))return;const r=await db.storage.from('hiring-assets').download(path);if(!r.data)return;const bytes=new Uint8Array(await r.data.arrayBuffer());const img=bytes[0]===137?await pdf.embedPng(bytes):await pdf.embedJpg(bytes);const scale=Math.min(w/img.width,h/img.height);if(y<h+90){page=pdf.addPage([595.28,841.89]);y=780;}page.drawImage(img,{x:48,y:y-h,width:img.width*scale,height:img.height*scale});y-=h+10;}
 const code=snap.values.application_code;
 await image(snap.logo,140,45);line('Admakai',22);if(snap.address)line(snap.address,9);line(kind==='offer'?'Offer letter':'Promotion letter',18);line(`${code} · Template version ${snap.version}`,9);y-=15;for(const p of text.split('\n'))line(p);await image(snap.signature,180,65);
 const pages=pdf.getPages();pages.forEach((p,i)=>p.drawText(`Admakai · ${code} · Page ${i+1} of ${pages.length}`,{x:48,y:35,size:8,font:latin,color:rgb(.4,.4,.4)}));
 const bytes=await pdf.save();const path=`${snap.candidate_id}/${snap.application_id}/${kind}-${snap.stage_key}-v${snap.version}-${key}.pdf`;const upload=await db.storage.from('letters').upload(path,bytes,{contentType:'application/pdf',upsert:true});if(upload.error)throw upload.error;
 const existing=await db.from('documents').select('id').eq('candidate_id',snap.candidate_id).eq('file_path',path).maybeSingle();if(existing.error)throw existing.error;
 if(!existing.data)checked(await db.from('documents').insert({candidate_id:snap.candidate_id,kind:`${kind}_letter`,title:`${kind==='offer'?'Offer':'Promotion'} letter · ${snap.job_title}${snap.stage_label?` · ${snap.stage_label}`:''} · v${snap.version}`,file_path:path}).select('id').single());
 return {bucket:'letters',path,filename:`admakai-${kind}-${code}.pdf`};
}
/** Manual regenerate from the admin screen: a fresh snapshot, queued and processed like any other delivery. */
export async function generateHiringLetter(application:string,kind:'offer'|'promotion',journey?:string,startDate?:string){
 const snap=await snapshotLetter(application,kind,journey,startDate);
 const row=await enqueue({kind:kind==='offer'?'offer_letter':'promotion_letter',trigger_key:'manual',event_id:crypto.randomUUID(),application_id:application,journey_id:journey??null,payload:snap});
 const r=await processOutbox([row]);if(r.statuses[row]!=='sent')throw new Error('The letter could not be created yet. It is queued and will be retried.');return {outboxId:row};
}
export async function deliverJourneyStage(application:string,journey:string,stage:string,note:string,eventId:string){
 const j=checked(await db.from('member_journeys').select('pipeline_id,stage_started_at').eq('id',journey).single());const s=checked(await db.from('pipeline_stages').select('candidate_label,sends_email').eq('pipeline_id',j.pipeline_id).eq('key',stage).single());
 const ids:string[]=[];const attachments:OutboxAttachment[]=[];
 if(['project','salary'].includes(stage)){const snap=await snapshotLetter(application,'promotion',journey);const letter=await enqueue({kind:'promotion_letter',trigger_key:stage,event_id:eventId,application_id:application,journey_id:journey,payload:snap});ids.push(letter);attachments.push({filename:`admakai-promotion-${snap.values.application_code}.pdf`,from_outbox:letter});}
 if(s.sends_email){const mail=await sendHiringEmail('journey_stage_changed',application,{tracker_link:'https://admakai.com/dashboard/journey',stage_name:s.candidate_label,start_date:dhakaDate(j.stage_started_at),status_message:note},attachments,{eventId,journeyId:journey,waitFor:[...ids],process:false});ids.push(mail.outboxId);}
 return ids.length?processOutbox(ids):null;
}
/** Template test sends through the outbox like every real email. */
export async function sendTemplateTest(to:string,trigger:string,subject:string,body:string){const settings=checked(await db.from('hiring_settings').select('from_email,reply_to,company_address').single());const title=fillHiringTemplate(subject,previewValues),text=fillHiringTemplate(body,previewValues);
 const id=await enqueue({kind:'email',trigger_key:trigger,event_id:crypto.randomUUID(),payload:{messages:[{to,from:settings.from_email,reply_to:settings.reply_to,subject:`[Test] ${title}`,text,html:hiringEmailHtml(title,text,'https://admakai.com/dashboard',settings.company_address??'')}],attachments:[]}});
 const r=await processOutbox([id]);const status=r.statuses[id]??'pending';let error:string|null=null;if(status!=='sent'){const row=await db.from('delivery_outbox' as never).select('last_error').eq('id' as never,id).single();error=(row.data as unknown as {last_error:string|null}|null)?.last_error??null;}return {status,error,outboxId:id};}
