import { describe, expect, it } from "vitest";
import { contentPartner, pricingInclusions } from "./pricing";

describe("Content Partner terms", () => {
  it("uses the Growth minimum", () => expect(contentPartner().priceMinUsd).toBe(550));
  it("uses the Growth maximum", () => expect(contentPartner().priceMaxUsd).toBe(950));
  it("includes 8 monthly videos", () => expect(contentPartner().videos).toBe(8));
  it("includes 16 monthly statics", () => expect(contentPartner().statics).toBe(16));
  it("allows pause or cancellation each month", () => expect(contentPartner().canPauseOrCancelMonthly).toBe(true));
  it("promises a first cut in 5 days", () => expect(contentPartner().firstCutDays).toBe(5));
  it("makes the month free when the first cut is late", () => expect(contentPartner().freeMonthIfFirstCutLate).toBe(true));
  it("includes two revision rounds per piece", () => expect(contentPartner().revisionRounds).toBe(2));
  it("includes all eight requested service categories", () => expect(pricingInclusions()).toHaveLength(8));
});
