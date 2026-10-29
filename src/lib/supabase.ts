import { createClient } from "@supabase/supabase-js";

const rawUrl = import.meta.env['VITE_SUPABASE_URL'] as string | undefined;
const anonKey = (import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string | undefined) ?? (import.meta.env['VITE_SUPABASE_ANON_KEY'] as string | undefined) ?? "";

// Guard against unfilled placeholders so the app still boots before real keys are set.
const url = rawUrl && /^https?:\/\//.test(rawUrl) ? rawUrl : "https://placeholder.supabase.co";

export const supabase = createClient(url, anonKey || "placeholder-anon-key", {
  auth: { persistSession: true, autoRefreshToken: true },
  global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    if (anonKey.startsWith('sb_') && headers.get('Authorization') === `Bearer ${anonKey}`) headers.delete('Authorization');
    headers.set('apikey', anonKey);
    return fetch(input, { ...init, headers });
  } },
});
