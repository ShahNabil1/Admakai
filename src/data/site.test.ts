import { expect, it } from "vitest";
import { resolveSiteSettings } from "./site";
it("keeps unknown contact and socials hidden", () => {
  const site = resolveSiteSettings([]);
  expect(site.EMAIL).toBe(""); expect(site.WHATSAPP).toBe("");
  expect(Object.values(site.SOCIALS).filter(Boolean)).toHaveLength(0);
});
it("accepts only international digits for WhatsApp", () => {
  expect(resolveSiteSettings([{ key: "WHATSAPP", value: "8801712345678" }]).WHATSAPP).toBe("8801712345678");
  expect(resolveSiteSettings([{ key: "WHATSAPP", value: "+880 1712" }]).WHATSAPP).toBe("");
});
it("uses saved public settings ahead of fallback values", () => {
  expect(resolveSiteSettings([{ key: "TAGLINE", value: "Saved tagline" }]).TAGLINE).toBe("Saved tagline");
});