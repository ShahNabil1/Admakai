export const letterVariables=['candidate_name','job_title','stage_name','start_date','date','application_code'];
export function fillHiringTemplate(body:string,values:Record<string,string>){return body.replace(/{{\s*([a-z_]+)\s*}}/g,(_,key:string)=>values[key]??'');}
export function journeyDays(at:string,now=Date.now()){return Math.max(1,Math.floor((now-new Date(at).getTime())/86400000)+1);}
export function needsJourneyReason(stage:string){return ['paused','ended'].includes(stage);}
export function letterKind(stage:string):'offer'|'promotion'|null{return stage==='offer'?'offer':['project','salary'].includes(stage)?'promotion':null;}
export function paidProjectTotal(projects:Array<{is_paid:boolean;amount:number|null}>){return projects.reduce((sum,p)=>sum+(p.is_paid?(p.amount??0):0),0);}
export function documentBucket(kind:string){return ['offer_letter','promotion_letter'].includes(kind)?'letters':'agreements';}
export const previewValues={candidate_name:'Sample Applicant',job_title:'Video Artist',stage_name:'Project Stage',start_date:'15 November 2026',date:'8 November 2026',application_code:'ADM-SAMPLE',tracker_link:'https://admakai.com/dashboard',status_message:'Your next chapter at Admakai is ready.'};
