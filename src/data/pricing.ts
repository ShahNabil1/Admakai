export const PRICE_MONTHLY: string | number = "[price]";
export const CURRENCY = "BDT";
export const contentPartner = {
  name: "Monthly content partner",
  videos: 8,
  statics: 16,
  firstCutDays: 5,
  revisionRounds: 2,
  canPauseOrCancelMonthly: true,
  freeMonthIfFirstCutLate: true,
} as const;

export const pricingInclusions = [
  "AI commercials",
  "AI UGC ads",
  "Product photoshoots",
  "Brand models and clones",
  "Voice and dubbing",
  "Motion and logo animation",
  "Captions in Bangla and English",
  `${contentPartner.revisionRounds === 2 ? "Two" : contentPartner.revisionRounds} revision rounds per piece`,
];

export function numericMonthlyPrice(price: string | number): number | null {
  if (typeof price === "string" && !/^\d+(?:\.\d+)?$/.test(price.trim())) return null;
  const amount = Number(price);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}
export interface PricingTier { id:string; slug:string; name:string; forLine:string; videos:number; statics:number; revisionRounds:number; turnaroundDays:number; calls:string; price:string; badge:string; }
export const pricingTiers: PricingTier[] = [
 {id:'starter',slug:'starter',name:'Starter',forLine:'A brand that posts weekly',videos:4,statics:8,revisionRounds:2,turnaroundDays:5,calls:'Monthly strategy call',price:'[price]',badge:''},
 {id:'growth',slug:'growth',name:'Growth',forLine:'A brand running paid ads',videos:8,statics:16,revisionRounds:2,turnaroundDays:5,calls:'Two calls a month',price:'[price]',badge:'Most picked'},
 {id:'scale',slug:'scale',name:'Scale',forLine:'A brand across several channels',videos:16,statics:30,revisionRounds:3,turnaroundDays:3,calls:'Weekly call',price:'[price]',badge:''},
];
export const pricingFaq = [
 {id:'cheaper',question:'Why is this cheaper than a shoot?',answer:'No crew, no studio, no travel, no model day rate. The time goes into the idea and the finish, not logistics.'},
 {id:'small',question:'Can I start small?',answer:'Yes. One Product Film or one Photoshoot is the usual first order. Most clients move to a plan after that.'},
 {id:'call',question:'Do you charge for the call?',answer:'No. The fifteen minute call is free and ends with a written quote.'},
 {id:'cut',question:"What happens if I don't like the first cut?",answer:'Two rounds are included. If it still misses the brief, we talk, and we fix it before any more money changes hands.'},
];
