import { useSupabaseTable } from './useSupabaseTable';
export interface SiteSetting { key:string; value:unknown; }
export const useSiteSettings = () => useSupabaseTable<SiteSetting>('site_settings');
