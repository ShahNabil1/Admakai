import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { publicSiteKeys, resolveSiteSettings } from "@/data/site";

export const getPublicSiteDetails = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return { site: resolveSiteSettings([]), year: new Date().getUTCFullYear() };
  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers, signal: AbortSignal.timeout(3000) });
      } },
    });
    const { data, error } = await client.from("site_settings").select("key,value").in("key", publicSiteKeys);
    return { site: resolveSiteSettings(error ? [] : data ?? []), year: new Date().getUTCFullYear() };
  } catch {
    return { site: resolveSiteSettings([]), year: new Date().getUTCFullYear() };
  }
});