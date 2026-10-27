import { useSupabaseTable } from './useSupabaseTable';
import type { PricingTier } from '@/data/pricing';
export type { PricingTier } from '@/data/pricing';
export const usePricingTiers = () => useSupabaseTable<PricingTier>('pricing_tiers');
