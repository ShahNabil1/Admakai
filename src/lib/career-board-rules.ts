import { z } from 'zod';
import { fallback, zodValidator } from '@tanstack/zod-adapter';

export const boardGroups = [
  { key: 'types', label: 'Type', options: [['internship','Internship'],['full_time','Full-time'],['part_time','Part-time'],['freelance','Freelance']] },
  { key: 'modes', label: 'Work mode', options: [['office','Office'],['remote','Remote'],['hybrid','Hybrid']] },
  { key: 'experience', label: 'Experience', options: [['none','No experience needed'],['junior','Junior'],['mid','Mid'],['senior','Senior']] },
  { key: 'schedules', label: 'Schedule', options: [['day','Day'],['evening','Evening'],['flexible','Flexible']] },
] as const;
export const boardSearchSchema = z.object({
  q: fallback(z.string(), '').default(''),
  types: fallback(z.array(z.string()), []).default([]),
  modes: fallback(z.array(z.string()), []).default([]),
  experience: fallback(z.array(z.string()), []).default([]),
  schedules: fallback(z.array(z.string()), []).default([]),
  sort: fallback(z.string(), 'latest').default('latest'),
});
export const validateBoardSearch = zodValidator(boardSearchSchema);
export type BoardSearch = z.infer<typeof boardSearchSchema>;
export const clearBoardSearch: BoardSearch = {q:'',types:[],modes:[],experience:[],schedules:[],sort:'latest'};
type FilterableJob = {title:string; summary:string|null; type:string; work_mode:string; experience_level?:string; schedule?:string; created_at:string};
export function filterBoardJobs<T extends FilterableJob>(jobs:T[], search:BoardSearch):T[] {
  const query=search.q.trim().toLocaleLowerCase();
  const matches=(values:string[], value:string) => !values.length || values.includes(value);
  return jobs.filter(job =>
    (!query || `${job.title} ${job.summary ?? ''}`.toLocaleLowerCase().includes(query)) &&
    matches(search.types,job.type) && matches(search.modes,job.work_mode) &&
    matches(search.experience,job.experience_level ?? 'none') && matches(search.schedules,job.schedule ?? 'evening')
  ).sort((a,b) => search.sort === 'oldest' ? a.created_at.localeCompare(b.created_at) : b.created_at.localeCompare(a.created_at));
}