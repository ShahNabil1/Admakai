import {createFileRoute} from '@tanstack/react-router';
import {timingSafeEqual} from 'node:crypto';
export const Route=createFileRoute('/api/public/hiring-reminders')({server:{handlers:{POST:async({request})=>{
 const secret=process.env['CRON_SECRET'];const token=request.headers.get('Authorization')?.replace(/^Bearer /,'')??'';
 if(!secret)return Response.json({error:'Reminder scheduler is not configured'},{status:503});
 const a=new TextEncoder().encode(token),b=new TextEncoder().encode(secret);if(a.length!==b.length||!timingSafeEqual(a,b))return Response.json({error:'Unauthorized'},{status:401});
 const {sendAllReminders}=await import('@/lib/crm-emails.server');return Response.json(await sendAllReminders(),{headers:{'Cache-Control':'no-store'}});
}}}});