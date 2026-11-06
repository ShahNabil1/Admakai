import { publishedServices } from '@/data/services';
import { matchService, type MatchResult } from '@/lib/serviceMatcher';

export const FINDER_REPLY_DELAY = 600;
export const FINDER_REDIRECT_DELAY = 3000;
export const FINDER_HISTORY_LIMIT = 4;
export type FinderExchange = { id: number; text: string; result: MatchResult; ready: boolean };
export function createFinderExchange(id: number, text: string): FinderExchange {
  return { id, text: text.trim(), result: matchService(text.trim(), publishedServices().map(service => service.slug)), ready: false };
}
export function appendFinderExchange(history: FinderExchange[], exchange: FinderExchange) {
  return [...history, exchange].slice(-FINDER_HISTORY_LIMIT);
}

export type SpeechResultEvent = { results: ArrayLike<{ isFinal: boolean; 0?: { transcript: string } }> };
export type BrowserSpeechRecognition = {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void; stop: () => void; abort: () => void;
};
export type SpeechConstructor = new () => BrowserSpeechRecognition;