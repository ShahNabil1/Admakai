import { describe, expect, it } from "vitest";
import { CURRENCY, PRICE_MONTHLY, contentPartner, numericMonthlyPrice, pricingInclusions } from "./pricing";

describe("Content Partner terms", () => {
  it("keeps the BDT price unset until supplied", () => {
    expect(CURRENCY).toBe("BDT");
    expect(PRICE_MONTHLY).toBe("[price]");
    expect(numericMonthlyPrice(PRICE_MONTHLY)).toBeNull();
  });
  it("includes 8 monthly videos", () => expect(contentPartner.videos).toBe(8));
  it("includes 16 monthly statics", () => expect(contentPartner.statics).toBe(16));
  it("allows pause or cancellation each month", () => expect(contentPartner.canPauseOrCancelMonthly).toBe(true));
  it("promises a first cut in 5 days", () => expect(contentPartner.firstCutDays).toBe(5));
  it("makes the month free when the first cut is late", () => expect(contentPartner.freeMonthIfFirstCutLate).toBe(true));
  it("includes two revision rounds per piece", () => expect(contentPartner.revisionRounds).toBe(2));
  it("includes all eight requested service categories", () => expect(pricingInclusions).toHaveLength(8));
  it("animates only valid numeric amounts", () => {
    expect(numericMonthlyPrice("25000")).toBe(25000);
    expect(numericMonthlyPrice(1200)).toBe(1200);
    expect(numericMonthlyPrice("")).toBeNull();
    expect(numericMonthlyPrice("[price]")).toBeNull();
    expect(numericMonthlyPrice(-1)).toBeNull();
  });
});