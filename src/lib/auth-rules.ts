export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 16;

/** Returns an error message, or null when the password meets the length rule. */
export function passwordError(password: string): string | null {
  if (password.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
  if (password.length > PASSWORD_MAX) return `Password can be at most ${PASSWORD_MAX} characters.`;
  return null;
}

/** Keeps only ASCII digits from any script and caps at six for the email code. */
export function normalizeOtp(raw: string): string {
  const mapped = raw.replace(/[০-৯٠-٩۰-۹०-९０-９]/g, ch => {
    const c = ch.charCodeAt(0);
    for (const base of [0x09e6, 0x0660, 0x06f0, 0x0966, 0xff10]) if (c >= base && c <= base + 9) return String(c - base);
    return ch;
  });
  return mapped.replace(/\D/g, '').slice(0, 6);
}

export const isOtp = (value: string) => /^\d{6}$/.test(value);
