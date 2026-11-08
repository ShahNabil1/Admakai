import { PDFDocument, rgb, StandardFonts, type PDFImage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import QRCode from 'qrcode';
import { latinFont, bengaliFont } from './hiring-fonts.server';
import { fillAgreement } from './application-rules';
import { dhakaDate } from './candidate-rules';

export type DeclarationSnapshot = {
  app: { id:string; candidate_id:string; public_code:string; submitted_at?:string|null; passport_photo_path?:string|null };
  candidate: { full_name:string; phone?:string|null; whatsapp?:string|null; area?:string|null };
  job: { title:string };
  profile: { email:string };
  settings: { company_address?:string|null; from_email:string; pdf_logo_url?:string|null; authorised_signature_url?:string|null; authorised_signatory_name?:string; authorised_signatory_title?:string };
  signed: { template_id:string; template_version:number; signer_full_name:string; signed_at:string; signature_path:string; accepted_terms:unknown; ip_address?:unknown };
  template: { name:string; body:string };
  answers?:Array<{label:string;answer:unknown}>;
  images?: { logo:string; passport:string; applicant:string; authorised:string };
};
const decode=(s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
export async function pdfHash(bytes:Uint8Array) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(bytes)))].map(b=>b.toString(16).padStart(2,'0')).join(''); }

/** Pure renderer: every non-status value and image comes from a frozen delivery snapshot. */
export async function renderDeclarationPdf(s:DeclarationSnapshot,statusLabel:string,statusColor:string) {
  if(!s.images?.logo)throw new Error('Upload the required PDF logo in Hiring Settings.');
  if(!s.images.applicant)throw new Error('Applicant signature image unavailable.');
  if(!s.images.authorised)throw new Error('Upload the authorised signature in Hiring Settings.');
  if(!s.images.passport)throw new Error('Passport photo unavailable.');
  const doc=await PDFDocument.create();doc.registerFontkit(fontkit);
  doc.setCreationDate(new Date(s.signed.signed_at));doc.setModificationDate(new Date(s.signed.signed_at));
  const latin=await doc.embedFont(decode(latinFont)),bengali=await doc.embedFont(decode(bengaliFont)),bold=await doc.embedFont(StandardFonts.HelveticaBold);
  const ink=rgb(.08,.08,.08),muted=rgb(.38,.38,.38),lineColor=rgb(.83,.83,.83),accent=rgb(.95,.76,.08);
  const embed=async(b:string):Promise<PDFImage>=>{const bytes=decode(b);return bytes[0]===137?doc.embedPng(bytes):doc.embedJpg(bytes);};
  const [logo,photo,applicant,authorised]=await Promise.all([embed(s.images.logo),embed(s.images.passport),embed(s.images.applicant),embed(s.images.authorised)]);
  let page=doc.addPage([595.28,841.89]),y=787;
  const fontFor=(t:string,strong=false)=>/[\u0980-\u09ff]/.test(t)?bengali:strong?bold:latin;
  const safe=(t:string,strong=false)=>{const f=fontFor(t,strong);return [...t].map(c=>f.getCharacterSet().includes(c.codePointAt(0)??0)?c:'?').join('');};
  const text=(t:string,x:number,at:number,size=9,strong=false,color=ink)=>page.drawText(safe(t,strong),{x,y:at,size,font:fontFor(t,strong),color});
  const fitImage=(img:PDFImage,x:number,at:number,w:number,h:number)=>{const scale=Math.min(w/img.width,h/img.height);page.drawImage(img,{x:x+(w-img.width*scale)/2,y:at+(h-img.height*scale)/2,width:img.width*scale,height:img.height*scale});};
  function newPage(){page=doc.addPage([595.28,841.89]);y=780;text('ADMAKAI  /  '+s.app.public_code,48,y,8,true,muted);y-=26;}
  function ensure(h:number){if(y-h<103)newPage();}
  function wrap(t:string,width:number,size=9,strong=false){const font=fontFor(t,strong);const rows:string[]=[];let row='';for(const word of safe(t,strong).split(/\s+/)){const next=row?row+' '+word:word;if(font.widthOfTextAtSize(next,size)<=width){row=next;continue;}if(row){rows.push(row);row='';}for(const c of word){if(font.widthOfTextAtSize(row+c,size)>width&&row){rows.push(row);row='';}row+=c;}}if(row)rows.push(row);return rows;}
  function paragraph(t:string,size=9,strong=false,x=48,width=499){if(!t.trim()){y-=6;return;}const rows=wrap(t,width,size,strong);ensure(Math.min(rows.length*14+6,80));for(const r of rows){ensure(15);text(r,x,y,size,strong);y-=14;}y-=6;}
  function heading(t:string){ensure(46);y-=12;text(t,48,y,12,true);y-=23;}
  fitImage(logo,48,741,138,48);text('Admakai',48,725,14,true);
  let addressY=708;for(const row of wrap(s.settings.company_address??'',275,8)){text(row,48,addressY,8,false,muted);addressY-=12;}
  text('admakai.com',48,addressY-4,8);text(s.settings.from_email,48,addressY-17,8);
  page.drawRectangle({x:467,y:687,width:70,height:90,borderColor:lineColor,borderWidth:.7});fitImage(photo,468,688,68,88);
  let infoY=672;text('Application ID: '+s.app.public_code,352,infoY,8,true);infoY-=20;
  const m=/^#([a-f\d]{6})$/i.exec(statusColor);const n=m?parseInt(m[1]??'',16):0x444444;const pill=rgb((n>>16&255)/255,(n>>8&255)/255,(n&255)/255);
  page.drawRectangle({x:352,y:infoY-5,width:185,height:19,color:rgb(.96,.96,.96)});text('Status: '+statusLabel,359,infoY+1,8,true,pill);
  text('Applied on: '+dhakaDate(s.app.submitted_at??s.signed.signed_at),352,626,8);
  for(const [i,r] of wrap('Position: '+s.job.title,185,8).entries())text(r,352,610-i*12,8);
  page.drawLine({start:{x:48,y:574},end:{x:547,y:574},thickness:1.5,color:accent});
  const declaration=s.template.name==='Application Declaration and Consent';
  const title=declaration?'APPLICATION DECLARATION AND CONSENT':s.template.name.toUpperCase();
  y=547;for(const r of wrap(title,499,14,true)){text(r,(595.28-bold.widthOfTextAtSize(safe(r,true),14))/2,y,14,true);y-=19;}
  if(declaration){const sub='Admakai Internship Program';text(sub,(595.28-latin.widthOfTextAtSize(sub,10))/2,y,10,false,muted);y-=17;}
  heading('Applicant details');
  const answer=(label:string)=>{const a=s.answers?.find(a=>a.label===label)?.answer;return typeof a==='string'?a:'Not provided';};
  const details=[['Full name',s.signed.signer_full_name],['Email',s.profile.email],['Phone',s.candidate.phone??'Not provided'],['WhatsApp',s.candidate.whatsapp??'Not provided'],['Area',s.candidate.area??'Not provided'],['Start availability',answer('When can you start?')],['Preferred work place',answer('Where would you like to work from?')]];
  for(let i=0;i<details.length;i+=2){const pair=details.slice(i,i+2);const height=Math.max(...pair.map(d=>wrap(d[1]??'',225,9).length))*14+29;ensure(height);page.drawLine({start:{x:48,y:y+10},end:{x:547,y:y+10},thickness:.5,color:lineColor});for(const [col,d] of pair.entries()){const x=48+col*257;text(d[0]??'',x,y,7,true,muted);for(const [r,t] of wrap(d[1]??'',225,9).entries())text(t,x,y-15-r*14,9);}y-=height;}
  heading(declaration?'Declaration':'Signed agreement');
  const body=fillAgreement(s.template.body,s.signed.signer_full_name,s.job.title,s.app.public_code,new Date(s.signed.signed_at));
  for(const t of body.split('\n')){if(declaration&&(t.includes('APPLICATION DECLARATION AND CONSENT')||t==='Admakai Internship Program'))continue;const strong=/^(\*\*|#)/.test(t);paragraph(t.replace(/^#+\s*/,'').replace(/\*\*/g,''),strong?10:9,strong);}
  heading('Acknowledgements');
  for(const term of Array.isArray(s.signed.accepted_terms)?s.signed.accepted_terms:[]){if(typeof term!=='string')continue;ensure(wrap(term,478).length*14+10);page.drawRectangle({x:48,y:y-1,width:9,height:9,borderWidth:.7,borderColor:ink});page.drawLine({start:{x:50,y:y+3},end:{x:52,y:y+1},thickness:1,color:ink});page.drawLine({start:{x:52,y:y+1},end:{x:56,y:y+6},thickness:1,color:ink});paragraph(term,9,false,68,479);}
  ensure(165);y-=18;page.drawLine({start:{x:48,y:y+9},end:{x:547,y:y+9},thickness:.5,color:lineColor});
  text('Applicant',48,y,11,true);text('For Admakai',305,y,11,true);fitImage(applicant,48,y-69,225,54);fitImage(authorised,305,y-69,225,54);
  text(s.signed.signer_full_name,48,y-83,10,true);text(s.settings.authorised_signatory_name??'Nasrin Akter',305,y-83,10,true);
  text('Signed: '+dhakaDate(s.signed.signed_at,true)+' (Asia/Dhaka)',48,y-101,7);
  text(s.settings.authorised_signatory_title??'Chief Executive Officer',305,y-101,9);
  text('IP: '+(typeof s.signed.ip_address==='string'?s.signed.ip_address:'Not recorded'),48,y-117,8);
  text('Date: '+dhakaDate(s.app.submitted_at??s.signed.signed_at),305,y-117,8);
  // A file cannot contain its own SHA-256. Footer ID hashes frozen document content; final byte hash is stored separately.
  const documentId=(await pdfHash(new TextEncoder().encode(JSON.stringify({snapshot:s,statusLabel,statusColor})))).slice(0,12);
  const qr=await doc.embedPng(decode((await QRCode.toDataURL('https://admakai.com/dashboard/applications/'+s.app.id,{width:180,margin:1,errorCorrectionLevel:'M'})).split(',')[1]??''));
  const pages=doc.getPages();for(const [i,p] of pages.entries()){page=p;page.drawLine({start:{x:48,y:82},end:{x:547,y:82},thickness:.5,color:lineColor});text(declaration?'This document is an application declaration and not an employment contract.':'Historical signed agreement - original terms and signatures preserved.',48,64,7,false,muted);text('Document ID: '+documentId,48,46,7,false,muted);text(`Page ${i+1} of ${pages.length}`,350,46,7,false,muted);fitImage(qr,492,28,48,48);}
  return {bytes:await doc.save(),documentId};
}