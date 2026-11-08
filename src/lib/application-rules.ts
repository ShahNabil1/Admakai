import { z } from 'zod';
export const APPLICATION_STEPS = ['Sign in','About you','Screening questions','Portfolio and CV','Practical task','Agreement and signature','Review and submit'];
export const PHOTO_LIMIT = 2 * 1024 * 1024;
export const CV_LIMIT = 5 * 1024 * 1024;
export const RESEND_SECONDS = 60;
export const AUTOSAVE_MS = 1000;
export const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
export const phoneSchema = z.string().trim().regex(/^(\+8801|01)[3-9]\d{8}$/, 'Enter a Bangladesh number starting with +880 or 01.');
export const candidateSchema = z.object({
  full_name: z.string().trim().min(2, 'Enter your full name.').max(100),
  phone: phoneSchema,
  whatsapp: z.union([phoneSchema,z.literal('')]),
  area: z.string().trim().min(1,'Enter your area or city.').max(150),
  education: z.string().trim().min(1,'Enter your education.').max(300),
  current_occupation: z.string().trim().min(1,'Tell us what you do now.').max(300),
});
export type CandidateFields = z.infer<typeof candidateSchema>;
export type Answer = string | number | string[] | null;
export type ApplicationQuestion = { id: string; label: string; type: string; options: unknown; required: boolean; section: string | null; sort_order: number; max_length: number | null; help_text: string | null };
export const validUrl = (s: string) => z.string().url().max(2048).refine(v => /^https?:\/\//i.test(v)).safeParse(s).success;
export function answerError(q: ApplicationQuestion, value: Answer | undefined) {
  const empty = value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && !value.trim());
  if (empty) return q.required ? 'Please answer this question.' : null;
  if (['link','video_link'].includes(q.type) && (typeof value !== 'string' || !validUrl(value))) return 'Enter a valid http or https link.';
  if (typeof value === 'string' && value.length > (q.max_length ?? 3000)) return `Keep this under ${q.max_length ?? 3000} characters.`;
  if (q.type === 'yes_no' && !['yes','no'].includes(String(value))) return 'Choose Yes or No.';
  if (q.type === 'rating' && (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 5)) return 'Choose a rating from 1 to 5.';
  const options = Array.isArray(q.options) ? q.options : [];
  if (q.type === 'single_choice' && !options.includes(value)) return 'Choose one option.';
  if (q.type === 'multi_choice' && (!Array.isArray(value) || value.some(v => !options.includes(v)))) return 'Choose from these options.';
  return null;
}
export function questionStep(q: ApplicationQuestion) { return q.section?.toLowerCase() === 'portfolio' ? 4 : q.section?.toLowerCase() === 'practical task' ? 5 : 3; }
export function nextApplicationStep(step: number, task: boolean) { return step === 4 && !task ? 6 : Math.min(7,step + 1); }
export function previousApplicationStep(step: number, task: boolean) { return step === 6 && !task ? 4 : Math.max(2,step - 1); }
export function fillAgreement(body: string, name: string, title: string, code: string, date: Date) {
  const values: Record<string,string> = {candidate_name:name,job_title:title,application_id:code,date:new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dhaka',day:'numeric',month:'long',year:'numeric'}).format(date)};
  return body.replace(/{{\s*(candidate_name|job_title|application_id|date)\s*}}/g, (_, key: string) => values[key] ?? '');
}
export function signatureIsMeaningful(points: {x:number;y:number}[]) {
  if (points.length < 12) return false;
  const xs = points.map(p=>p.x), ys = points.map(p=>p.y);
  const length = points.slice(1).reduce((sum,p,i)=> {const prev=points[i];return sum+(prev ? Math.hypot(p.x-prev.x,p.y-prev.y) : 0);},0);
  return Math.max(...xs)-Math.min(...xs) >= 35 && Math.max(...ys)-Math.min(...ys) >= 10 && length >= 80;
}
export function adminAccessAllowed(legacyRole: unknown, hiring: boolean) { return legacyRole === 'owner' || hiring; }