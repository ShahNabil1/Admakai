import { useSupabaseTable } from "./useSupabaseTable";

export interface SiteSetting {
  id: string;
  [key: string]: unknown;
}

export const useSiteSettings = () => useSupabaseTable<SiteSetting>("site_settings");
