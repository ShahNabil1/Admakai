// Free, rule-based service finder. Runs fully in the browser.
// No AI, no API calls, no database writes, no credits.

import { SERVICE_KEYWORDS } from "@/data/serviceKeywords";

export type MatchResult = {
  confidence: "strong" | "weak" | "none";
  best: string | null;        // slug
  alternatives: string[];     // up to 2 slugs
  scores: Record<string, number>;
};

const STOP_PHRASES = [
  "i need", "i want", "we need", "we want", "looking for", "can you", "please", "for my", "for our",
  "amar", "amader", "lagbe", "chai", "korte", "banate", "dorkar", "ekta", "kichu",
  "আমার", "আমাদের", "লাগবে", "চাই", "করতে", "বানাতে", "দরকার", "একটা", "কিছু"
];

export function normalize(input: string): string {
  return (" " + input + " ")
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, " ")
    .replace(/\s+/g, " ");
}

type Prepared = { slug: string; phrase: string; isPhrase: boolean; weight: number }[];

// "~word" = generic word (low weight), "!word" = strong signal (1.5x weight)
function parseKeyword(raw: string): { phrase: string; factor: number } {
  if (raw.startsWith("~")) return { phrase: normalize(raw.slice(1)).trim(), factor: 0.3 };
  if (raw.startsWith("!")) return { phrase: normalize(raw.slice(1)).trim(), factor: 1.5 };
  return { phrase: normalize(raw).trim(), factor: 1 };
}

function prepare(): Prepared {
  const df: Record<string, number> = {};
  const all: { slug: string; phrase: string; factor: number }[] = [];
  for (const [slug, words] of Object.entries(SERVICE_KEYWORDS)) {
    const seen = new Set<string>();
    for (const w of words) {
      const { phrase, factor } = parseKeyword(w);
      if (!phrase || seen.has(phrase)) continue;
      seen.add(phrase);
      all.push({ slug, phrase, factor });
      df[phrase] = (df[phrase] || 0) + 1;
    }
  }
  return all.map(({ slug, phrase, factor }) => {
    const isPhrase = phrase.includes(" ");
    const base = isPhrase ? 3 : 2;
    return { slug, phrase, isPhrase, weight: (base * factor) / Math.sqrt(df[phrase] as number) };
  });
}

const PREPARED = prepare();

const BANGLA = /[\u0980-\u09FF]/;

// Returns -2 for a phrase hit, the token index for a word hit, -1 for no hit.
function hit(text: string, tokens: string[], phrase: string, isPhrase: boolean): number {
  if (isPhrase) return text.includes(" " + phrase + " ") ? -2 : -1;
  // single word: exact token, or prefix match (handles plurals and Bangla endings like ঈদের, পোশাকের)
  const minPrefix = BANGLA.test(phrase) ? 2 : 4;
  return tokens.findIndex(t => t === phrase || (phrase.length >= minPrefix && t.startsWith(phrase)));
}

export function matchService(input: string, enabledSlugs?: string[]): MatchResult {
  const text = normalize(input);
  const tokens = text.trim().split(" ").filter(Boolean);
  const meaningful = STOP_PHRASES.reduce((t, p) => t.split(" " + normalize(p).trim() + " ").join(" "), text).trim();
  const scores: Record<string, number> = {};

  if (meaningful.length < 2) return { confidence: "none", best: null, alternatives: [], scores };

  // each word in the message counts at most once per service (its best keyword)
  const wordBest: Record<string, Record<number, number>> = {};
  for (const k of PREPARED) {
    if (enabledSlugs && !enabledSlugs.includes(k.slug)) continue;
    const h = hit(text, tokens, k.phrase, k.isPhrase);
    if (h === -1) continue;
    if (h === -2) { scores[k.slug] = (scores[k.slug] || 0) + k.weight; continue; }
    const m = (wordBest[k.slug] ||= {});
    m[h] = Math.max(m[h] || 0, k.weight);
  }
  for (const [slug, m] of Object.entries(wordBest)) {
    for (const w of Object.values(m)) scores[slug] = (scores[slug] || 0) + w;
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (!ranked.length) return { confidence: "none", best: null, alternatives: [], scores };

  const [bestSlug, bestScore] = ranked[0] as [string, number];
  const alternatives = ranked.slice(1, 3).filter(([, s]) => s >= bestScore * 0.35).map(([slug]) => slug);
  const margin = ranked[1] ? bestScore - ranked[1][1] : bestScore;

  let confidence: MatchResult["confidence"] = "weak";
  if (bestScore >= 2 && margin >= 0.5) confidence = "strong";
  if (bestScore < 0.5) confidence = "none";

  return { confidence, best: confidence === "none" ? null : bestSlug, alternatives, scores };
}
