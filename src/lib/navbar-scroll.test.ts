import { describe, expect, it } from "vitest";
import { getNavbarScrollState } from "./navbar-scroll";

describe("Navbar scroll rules", () => {
  it("only enters scrolled state after 80px", () => {
    expect(getNavbarScrollState(80, 79, false).scrolled).toBe(false);
    expect(getNavbarScrollState(81, 80, false).scrolled).toBe(true);
  });
  it("hides on scrolling down past 80px", () => {
    expect(getNavbarScrollState(150, 100, false).hidden).toBe(true);
  });
  it("shows on scrolling up", () => {
    expect(getNavbarScrollState(120, 150, true).hidden).toBe(false);
  });
  it("always shows at the top even when scrolling down", () => {
    expect(getNavbarScrollState(80, 20, true).hidden).toBe(false);
  });
  it("retains visibility when the scroll position does not change", () => {
    expect(getNavbarScrollState(150, 150, true).hidden).toBe(true);
    expect(getNavbarScrollState(150, 150, false).hidden).toBe(false);
  });
});