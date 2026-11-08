export type MonthlyPlan = {
  id: string; slug: string; name: string; forLine: string; badge: string;
  videos: number; statics: number; revisionRounds: number; turnaroundDays: number;
  turnaround: string; calls: string; priceMinUsd: number; priceMaxUsd: number;
  /** Highlighted card styling on /pricing (Growth today). */
  isHighlighted: boolean;
  ctaText: string;
  /** Empty means the standard inclusion list built from the allowances below. */
  features: string[];
};
// Emergency fallback and initial values; the live list is replaced in place from the database by src/lib/site-content.ts.
export const plans: MonthlyPlan[] = [
  { id: 'starter', slug: 'starter', name: 'Starter', forLine: 'A brand that posts weekly', badge: '', videos: 4, statics: 8, revisionRounds: 2, turnaroundDays: 5, turnaround: '5 day turnaround', calls: 'Monthly strategy call', priceMinUsd: 320, priceMaxUsd: 540, isHighlighted: false, ctaText: 'Start with a call', features: [] },
  { id: 'growth', slug: 'growth', name: 'Growth', forLine: 'A brand running paid ads', badge: 'Most picked', videos: 8, statics: 16, revisionRounds: 2, turnaroundDays: 5, turnaround: 'First cut in 5 days', calls: 'Two calls a month', priceMinUsd: 550, priceMaxUsd: 950, isHighlighted: true, ctaText: 'Start with a call', features: [] },
  { id: 'scale', slug: 'scale', name: 'Scale', forLine: 'A brand across several channels', badge: '', videos: 16, statics: 30, revisionRounds: 3, turnaroundDays: 3, turnaround: '3 day turnaround', calls: 'Weekly call', priceMinUsd: 1010, priceMaxUsd: 1760, isHighlighted: false, ctaText: 'Start with a call', features: [] },
];
const staticGrowth = plans[1] as MonthlyPlan;
/** Growth is the Home "Content partner" plan; falls back to the first plan, then the original Growth terms. */
export function growthPlan(): MonthlyPlan {
  return plans.find(plan => plan.slug === 'growth') ?? plans[0] ?? staticGrowth;
}
export function planInclusions(plan: MonthlyPlan) {
  if (plan.features.length) return plan.features;
  return [`${plan.videos} videos per month`, `${plan.statics} statics per month`, `${plan.revisionRounds} revision rounds`, plan.turnaround, plan.calls];
}
