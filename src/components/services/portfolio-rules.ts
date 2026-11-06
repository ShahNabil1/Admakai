export function portfolioTags(tags: (string | null | undefined)[]) {
  return [...new Set(tags.filter((tag): tag is string => Boolean(tag)))];
}
export function playingPreviews(visible: number[]) { return [...new Set(visible)].sort((a, b) => a - b).slice(0, 4); }
