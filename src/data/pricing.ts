import { growthPlan, plans, type MonthlyPlan } from './plans';
export type PricingTier = MonthlyPlan;
export const pricingTiers = plans;
export const contentPartner = {
  ...growthPlan,
  name: "Monthly content partner",
  firstCutDays: growthPlan.turnaroundDays,
  canPauseOrCancelMonthly: true,
  freeMonthIfFirstCutLate: true,
};
export const pricingInclusions = [
  "AI commercials", "AI UGC ads", "Product photoshoots", "Brand models and clones",
  "Voice and dubbing", "Motion and logo animation", "Captions in Bangla and English",
  `${contentPartner.revisionRounds === 2 ? "Two" : contentPartner.revisionRounds} revision rounds per piece`,
];
export const pricingFaq = [
 {id:'cheaper',question:'Why is this cheaper than a shoot?',answer:'No crew, no studio, no travel, no model day rate. The time goes into the idea and the finish, not logistics.'},
 {id:'small',question:'Can I start small?',answer:'Yes. One Product Film or one Photoshoot is the usual first order. Most clients move to a plan after that.'},
 {id:'call',question:'Do you charge for the call?',answer:'No. The fifteen minute call is free and ends with a written quote.'},
 {id:'cut',question:"What happens if I don't like the first cut?",answer:'Two rounds are included. If it still misses the brief, we talk, and we fix it before any more money changes hands.'},
];
