import { useSupabaseTable } from "./useSupabaseTable";

export interface TeamMember {
  id: string;
  [key: string]: unknown;
}

export const useTeam = () => useSupabaseTable<TeamMember>("team");
