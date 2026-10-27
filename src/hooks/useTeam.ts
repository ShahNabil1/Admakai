import { useSupabaseTable } from './useSupabaseTable';
import type { TeamMember } from '@/data/team';
export type { TeamMember } from '@/data/team';
export const useTeam = () => useSupabaseTable<TeamMember>('team');
