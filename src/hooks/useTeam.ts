import { team } from '@/data/team';
export type { TeamMember } from '@/data/team';
export const useTeam = () => ({data:team,loading:false,error:null});
