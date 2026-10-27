import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { getPublicRows } from '@/lib/public-data.functions';
export type PublicTable = 'projects'|'services'|'pricing_tiers'|'team'|'site_settings';
export interface TableResult<T> { data:T[]; loading:boolean; error:Error|null; }
export const publicTableQuery = (table:PublicTable) => queryOptions({queryKey:['public-content',table],queryFn:()=>getPublicRows({data:table}),staleTime:300000});
export function useSupabaseTable<T>(table:PublicTable):TableResult<T> { const {data}=useSuspenseQuery(publicTableQuery(table)); return {data:data as unknown as T[],loading:false,error:null}; }
