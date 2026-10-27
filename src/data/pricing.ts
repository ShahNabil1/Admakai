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