export function getNavbarScrollState(currentY: number, previousY: number, wasHidden: boolean) {
  const y = Math.max(0, currentY);
  return {
    scrolled: y > 80,
    hidden: y <= 80 ? false : y === previousY ? wasHidden : y > previousY,
  };
}