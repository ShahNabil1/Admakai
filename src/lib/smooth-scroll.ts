import Lenis from "lenis";
import { gsap, ScrollTrigger, registerGsap } from "./gsap";

/** Call once from a useEffect. Returns a cleanup function. */
export function initSmoothScroll(): () => void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  registerGsap();
  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);
  const tick = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
  };
}
