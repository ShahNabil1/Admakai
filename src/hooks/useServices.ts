import { useSupabaseTable } from "./useSupabaseTable";

export interface Service {
  id: string;
  [key: string]: unknown;
}

export const useServices = () => useSupabaseTable<Service>("services");
