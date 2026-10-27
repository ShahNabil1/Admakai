import { useSupabaseTable } from "./useSupabaseTable";

export interface Project {
  id: string;
  [key: string]: unknown;
}

export const useProjects = () => useSupabaseTable<Project>("projects");
