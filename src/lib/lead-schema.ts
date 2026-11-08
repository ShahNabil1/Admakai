import { z } from 'zod';
import { enquiryPhone, internationalPhone } from '@/lib/international-phone';
export const normalizeWhatsApp=enquiryPhone;
export const leadSchema=z.object({name:z.string().trim().min(1,'Enter your name.').max(100),brand:z.string().trim().min(1,'Enter your brand or company.').max(150),whatsapp:z.string().trim().transform(normalizeWhatsApp).refine(n=>internationalPhone(`+${n}`)!==null,'Enter a valid phone number for the selected country.'),email:z.string().trim().email('Enter a valid email.').max(255),service_slug:z.string().max(80),plan_slug:z.string().max(30).optional().default(''),budget_range:z.enum(['','under-20k','20k-50k','50k-100k','100k-plus','not-sure']),message:z.string().trim().max(2000,'Keep the message under 2,000 characters.').optional().default(''),website:z.string().max(200).optional().default(''),brand_website:z.string().trim().max(300).optional().default(''),source_page:z.string().trim().max(200).optional().default('')});
export function validateAttachment(file:File|null){if(!file||!file.size)return null;if(!['image/jpeg','image/png'].includes(file.type))return 'Choose a JPG or PNG photo.';if(file.size>=5*1024*1024)return 'The photo must be under 5 MB.';return null;}
export function whatsappUrl(number:string,message:string){return /^\d{8,15}$/.test(number)?`https://wa.me/${number}?text=${encodeURIComponent(message.slice(0,2000))}`:null;}

export const ENQUIRY_FILE_LIMIT=10*1024*1024;
export function validateEnquiryAttachment(file:File|null){if(!file||!file.size)return null;if(!['image/jpeg','image/png','application/pdf'].includes(file.type))return 'Choose a JPG, PNG or PDF file.';if(file.size>ENQUIRY_FILE_LIMIT)return 'The file must be 10 MB or smaller.';return null;}
/** Real file type from its first bytes, so a renamed file cannot pass. */
export function fileSignature(b:Uint8Array):'png'|'jpg'|'pdf'|null{if(b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71&&b[4]===13&&b[5]===10&&b[6]===26&&b[7]===10)return 'png';if(b[0]===255&&b[1]===216&&b[2]===255)return 'jpg';if(b[0]===37&&b[1]===80&&b[2]===68&&b[3]===70&&b[4]===45)return 'pdf';return null;}
