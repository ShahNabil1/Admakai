// Browser-safe rules for the white job details page (/careers/:slug).
export type JobFaq = { question: string; answer: string };

/** Only the job details page (not /careers or the apply wizard) gets the light header pill. */
export function isJobDetailsPath(pathname: string) {
  return /^\/careers\/[^/]+\/?$/.test(pathname);
}

/** Admin-edited FAQ rows from the job record; malformed or empty rows are skipped. */
export function jobFaqs(value: unknown): JobFaq[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(row => {
    if (!row || typeof row !== 'object') return [];
    const q = (row as Record<string, unknown>)['question'], a = (row as Record<string, unknown>)['answer'];
    return typeof q === 'string' && typeof a === 'string' && q.trim() && a.trim() ? [{ question: q.trim(), answer: a.trim() }] : [];
  });
}

const MODE: Record<string, string> = { office: 'Office', remote: 'Remote', hybrid: 'Hybrid' };
const TYPE: Record<string, string> = { internship: 'Internship', full_time: 'Full-time', freelance: 'Freelance' };
const SCHEDULE: Record<string, string> = { day: 'Day hours', evening: 'Evening hours', flexible: 'Flexible hours' };

/** Outlined chips on the job card, in order: craft, experience, hours, work mode. */
export function jobChips(job: { type: string; work_mode: string; experience_level: string; schedule: string }) {
  return [
    job.type === 'internship' ? 'AI Filmmaking' : TYPE[job.type] ?? job.type,
    job.experience_level === 'none' ? 'No experience needed' : null,
    SCHEDULE[job.schedule] ?? null,
    MODE[job.work_mode] ?? job.work_mode,
  ].filter((v): v is string => !!v);
}
export const workModeLabel = (mode: string) => MODE[mode] ?? mode;
export const jobTypeLabel = (type: string) => TYPE[type] ?? type.replaceAll('_', ' ');

/** "Posted 8 November 2026" in Dhaka time. */
export function postedLabel(iso: string) {
  return `Posted ${new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dhaka' }).format(new Date(iso))}`;
}

export function seatsLine(seats: number | null) {
  return seats ? ` · ${seats} seats in this batch` : '';
}

/** Careers screens never talk about money. */
export const MONEY_WORDS = /\b(fees?|free|paid|pay|payment|payments|stipends?|salary|salaries|salaried|price|prices|pricing|wages?)\b/i;
export function mentionsMoney(text: string) { return MONEY_WORDS.test(text); }
