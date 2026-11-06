import { plans } from '@/data/plans';
export type { MonthlyPlan as PricingTier } from '@/data/plans';
export const usePricingTiers = () => ({ data: plans, loading: false, error: null });
