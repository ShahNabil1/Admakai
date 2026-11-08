export const reviewerStages = ['submitted','in_review','shortlisted','interview_scheduled','interview_done'];
export function canMoveHiring(roles:string[],stage:string){return roles.includes('admin') || (roles.includes('reviewer') && reviewerStages.includes(stage));}
export function reminderEligible(at:string,sent:string|null,now=new Date()){const hours=(new Date(at).getTime()-now.getTime())/3600000;return sent===null && hours>=23 && hours<=25;}
export function averageRating(rows:Array<{skill_score:number|null;thinking_score:number|null;commitment_score:number|null}>){const scores=rows.flatMap(r=>[r.skill_score,r.thinking_score,r.commitment_score].filter((s):s is number=>s!==null));return scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:0;}
export function stageDays(at:string,now=new Date()){return Math.max(0,Math.floor((now.getTime()-new Date(at).getTime())/86400000));}
export function dhakaInput(iso:string){return new Date(new Date(iso).getTime()+21600000).toISOString().slice(0,16);}
export function interviewIcs(i:{id:string;scheduled_at:string;duration_minutes:number;mode:string;meet_link:string|null;office_address:string|null},title:string){
 const safe=(s:string)=>s.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
 const stamp=(s:number)=>new Date(s).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');const start=new Date(i.scheduled_at).getTime();
 return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Admakai//Hiring//EN','BEGIN:VEVENT',`UID:${i.id}@admakai.com`,`DTSTAMP:${stamp(Date.now())}`,`DTSTART:${stamp(start)}`,`DTEND:${stamp(start+i.duration_minutes*60000)}`,`SUMMARY:${safe('Admakai interview: '+title)}`,`LOCATION:${safe(i.mode==='meet'?i.meet_link ?? '':i.office_address ?? '')}`,'END:VEVENT','END:VCALENDAR',''].join('\r\n');
}
export function csvCell(value:unknown){const s=String(value??'');return '"'+(/^[=+@-]/.test(s)?"'"+s:s).replace(/"/g,'""')+'"';}