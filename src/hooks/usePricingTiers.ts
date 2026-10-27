import { useSupabaseTable } from "./useSupabaseTable";

export interface PricingTier {
  id: string;
  [key: string]: unknown;
}

export const usePricingTiers = () => useSupabaseTable<PricingTier>("pricing_tiers");
