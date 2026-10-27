export const SITE_URL = "https://admakai.com";
export const EMAIL = "";
export const WHATSAPP = "";
export const WHATSAPP_DISPLAY = "";
export const ADDRESS = "";
export const SOCIALS = { facebook: "", instagram: "", linkedin: "", youtube: "", tiktok: "" };
export const LEGAL_NAME = "Admakai";
export const TAGLINE = "AI ads that pass as human made. Directed in Dhaka, delivered anywhere.";
export const siteFallback = { EMAIL, WHATSAPP, WHATSAPP_DISPLAY, ADDRESS, SOCIALS, LEGAL_NAME, TAGLINE };
export type SiteDetails = typeof siteFallback;
export const publicSiteKeys = ["EMAIL", "WHATSAPP", "WHATSAPP_DISPLAY", "ADDRESS", "SOCIALS", "LEGAL_NAME", "TAGLINE"];
export function resolveSiteSettings(rows: { key: string; value: unknown }[]): SiteDetails {
  const result = { ...siteFallback, SOCIALS: { ...SOCIALS } };
  for (const { key, value } of rows) {
    if (key === "SOCIALS" && value && typeof value === "object") {
      for (const name of Object.keys(SOCIALS) as (keyof typeof SOCIALS)[]) {
        const url = (value as Record<string, unknown>)[name];
        if (typeof url === "string" && (url === "" || /^https:\/\//.test(url))) result.SOCIALS[name] = url;
      }
    } else if (key !== "SOCIALS" && publicSiteKeys.includes(key) && typeof value === "string") {
      const field = key as Exclude<keyof SiteDetails, "SOCIALS">;
      if (field === "WHATSAPP" && value && !/^\d+$/.test(value)) continue;
      if (field === "EMAIL" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) continue;
      result[field] = value;
    }
  }
  return result;
}