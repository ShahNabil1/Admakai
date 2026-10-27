import { useSupabaseTable } from './useSupabaseTable';
import type { Project } from '@/data/projects';
export type { Project } from '@/data/projects';
export const useProjects = () => useSupabaseTable<Project>('projects');
