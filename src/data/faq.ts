export const faqTerms = {
  standardFirstCutDays: 5,
  scaleFirstCutDays: 3,
  brandFilmDays: [7, 14],
  briefingMinutes: 15,
  referencePhotos: 1,
  revisionRounds: 2,
  cloningRequiresWrittenConsent: true,
  broadcastLicensingOnRequest: true,
  lateMonthlyFirstCutMakesMonthFree: true,
} as const;

export const faqItems = [
  { id: "look", question: "Do AI ads look fake?", answer: "Not the ones we ship. Pure AI output does look fake, so we don't ship pure AI output. A director locks the characters, locations and light with reference sheets, and an editor cuts, grades and captions every piece. Our clients run these ads on Facebook, YouTube and TV next to shot footage." },
  { id: "cost", question: "How much does an AI ad cost in Bangladesh?", answer: "A 30 second AI commercial from Admakai starts well under the cost of a one day shoot, because there is no crew, studio, travel or model fee. See per project prices on the Pricing page, or take the monthly plan if you post every week." },
  { id: "delivery", question: "How fast is delivery?", answer: `First cut in ${faqTerms.standardFirstCutDays} days for most ads, ${faqTerms.scaleFirstCutDays} days on the Scale plan, hours for UGC variants and hooks. Full brand films take ${faqTerms.brandFilmDays[0]} to ${faqTerms.brandFilmDays[1]} days.` },
  { id: "brief", question: "What do you need from us?", answer: `A ${faqTerms.briefingMinutes} minute call and one photo of the product, the model or you. We write the script, build the references and send the first cut for approval.` },
  { id: "ownership", question: "Who owns the ad?", answer: "You do. Every approved file is yours for digital use, with music and AI voices licensed. Broadcast and OTT licensing is available on request." },
  { id: "consent", question: "Can you use my face or a real model?", answer: "Yes. We can clone your face and voice for presenter videos with your written consent, or build a consistent AI brand model that is yours alone. We never clone a real person without their permission." },
  { id: "revisions", question: "What if I don't like the first cut?", answer: "Two revision rounds are included on every piece. If it still misses the brief, we talk and fix it before any more money changes hands. On the monthly plan, if the first cut is late, that month is free." },
] as const;

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map(item => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
};

export function toggleFaq(current: string | null, selected: string): string | null {
  return current === selected ? null : selected;
}