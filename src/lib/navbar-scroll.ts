export function getNavbarScrollState(currentY: number, _previousY: number, _wasHidden: boolean) {
  return { scrolled: Math.max(0, currentY) > 80, hidden: false };
}
