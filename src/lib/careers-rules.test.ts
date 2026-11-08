import { describe, it, expect } from "vitest";
import { canApply, daysUntil, matchesJob, talentSchema, jobPosting } from "./careers-rules";
const now = new Date("2026-11-08T07:47:00Z");
describe("careers rules", () => {
  it("deadline thirty days from November 8 is December 8", () =>
    expect(daysUntil("2026-12-08", now)).toBe(30));
  it("past deadlines cannot apply", () =>
    expect(canApply({ status: "open", deadline: "2026-11-07" }, now)).toBe(false));
  it("deadline remains available through Bangladesh local day", () => {
    expect(
      canApply({ status: "open", deadline: "2026-11-08" }, new Date("2026-11-08T17:59:00Z")),
    ).toBe(true);
    expect(
      canApply({ status: "open", deadline: "2026-11-08" }, new Date("2026-11-08T18:00:00Z")),
    ).toBe(false);
  });
  it("draft cannot apply", () =>
    expect(canApply({ status: "draft", deadline: "2026-12-08" }, now)).toBe(false));
  it("filters match type and work mode", () => {
    expect(matchesJob({ type: "internship", work_mode: "hybrid" }, "Internship")).toBe(true);
    expect(matchesJob({ type: "internship", work_mode: "hybrid" }, "Remote")).toBe(false);
  });
  it("normalizes talent email", () =>
    expect(
      talentSchema.parse({
        full_name: "Test Person",
        email: "TEST@example.com",
        phone: "",
        portfolio_url: "",
        interested_in: ["AI Video"],
        message: "",
      }).email,
    ).toBe("test@example.com"));
  it("rejects non-web portfolio links", () =>
    expect(
      talentSchema.safeParse({
        full_name: "Test Person",
        email: "test@example.com",
        phone: "",
        portfolio_url: "javascript:alert(1)",
        interested_in: [],
        message: "",
      }).success,
    ).toBe(false));
  it("draft is never a public JobPosting", () =>
    expect(
      jobPosting(
        {
          title: "Intern",
          summary: null,
          description: null,
          created_at: now.toISOString(),
          deadline: "2026-12-08",
          type: "internship",
          work_mode: "hybrid",
          status: "draft",
          slug: "intern",
        },
        now,
      ),
    ).toBeNull());
});
