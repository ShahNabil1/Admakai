import { describe, expect, it } from "vitest";
import { faqItems, faqTerms, toggleFaq } from "./faq";
describe("FAQ rules", () => {
  it("includes seven questions", () => expect(faqItems).toHaveLength(7));
  it("replaces the open answer when another is selected", () => expect(toggleFaq("look", "cost")).toBe("cost"));
  it("closes an answer when selected again", () => expect(toggleFaq("look", "look")).toBeNull());
  it("promises standard first cut in five days", () => expect(faqTerms.standardFirstCutDays).toBe(5));
  it("promises Scale first cut in three days", () => expect(faqTerms.scaleFirstCutDays).toBe(3));
  it("gives brand films seven to fourteen days", () => expect(faqTerms.brandFilmDays).toEqual([7, 14]));
  it("requires a fifteen minute briefing", () => expect(faqTerms.briefingMinutes).toBe(15));
  it("requires one reference photo", () => expect(faqTerms.referencePhotos).toBe(1));
  it("includes two revision rounds", () => expect(faqTerms.revisionRounds).toBe(2));
  it("requires written consent for cloning", () => expect(faqTerms.cloningRequiresWrittenConsent).toBe(true));
  it("makes broadcast licensing available on request", () => expect(faqTerms.broadcastLicensingOnRequest).toBe(true));
  it("makes a late monthly first cut free", () => expect(faqTerms.lateMonthlyFirstCutMakesMonthFree).toBe(true));
});