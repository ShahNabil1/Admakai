import { useSupabaseTable } from './useSupabaseTable';
import type { Service } from '@/data/services';
export type { Service } from '@/data/services';
export const useServices = () => useSupabaseTable<Service>('services');
