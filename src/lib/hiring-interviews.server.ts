import {supabaseAdmin as db} from '@/integrations/supabase/client.server';
import {sendHiringEmail,hiringDeliveryContext} from './hiring-delivery.server';
import {interviewIcs} from './hiring-review-rules';
import {dhakaDate} from './candidate-rules';
export async function deliverInterviewEmail(id:string,trigger:string,message=''){
 const {data:i,error}=await db.from('interviews').select('*').eq('id',id).single();if(error||!i)throw new Error('Interview unavailable');
 const {job}=await hiringDeliveryContext(i.application_id);
 const details=`${dhakaDate(i.scheduled_at,true)} (Asia/Dhaka)\nDuration: ${i.duration_minutes} minutes\nMode: ${i.mode==='meet'?'Google Meet':'Office'}\n${i.mode==='meet'?i.meet_link:i.office_address}`;
 const extra={status_message:trigger==='interview_cancelled'?`Your interview was cancelled. ${message}`:`${message}\n${details}`,interview_details:details};
 const attachments=trigger==='interview_cancelled'?[]:[{filename:'admakai-interview.ics',content:btoa(unescape(encodeURIComponent(interviewIcs(i,job.title))))}];
 return sendHiringEmail(trigger,i.application_id,extra,attachments);
}
export async function sendInterviewReminders(){
 const now=Date.now();const {data,error}=await db.from('interviews').select('id').in('status',['scheduled','rescheduled']).is('reminder_sent_at',null).gte('scheduled_at',new Date(now+23*3600000).toISOString()).lte('scheduled_at',new Date(now+25*3600000).toISOString());if(error)throw error;
 let sent=0,failed=0;for(const i of data??[]){
 const claim=await db.from('interviews').update({reminder_sent_at:new Date().toISOString()}).eq('id',i.id).is('reminder_sent_at',null).select('id');if(claim.error)throw claim.error;if(!claim.data?.length)continue;
 try{const result=await deliverInterviewEmail(i.id,'interview_reminder');if(result.some(r=>r.status==='sent'))sent++;else{failed++;await db.from('interviews').update({reminder_sent_at:null}).eq('id',i.id);}}catch{failed++;await db.from('interviews').update({reminder_sent_at:null}).eq('id',i.id);}
 }return {sent,failed};
}