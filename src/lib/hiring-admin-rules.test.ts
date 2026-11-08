import { describe, it, expect } from "vitest";
import {
  hiringCanRead,
  hiringCanWrite,
  publishErrors,
  daysLeft,
  questionSchema,
} from "./hiring-admin-rules";
describe("Hiring Step 4 rules", () => {
  it("admins can write", () => expect(hiringCanWrite(["admin"])).toBe(true));
  it("reviewers are read only", () => {
    expect(hiringCanRead(["reviewer"])).toBe(true);
    expect(hiringCanWrite(["reviewer"])).toBe(false);
  });
  it("interviewers are read only", () => {
    expect(hiringCanRead(["interviewer"])).toBe(true);
    expect(hiringCanWrite(["interviewer"])).toBe(false);
  });
  it("candidates cannot read hiring", () => expect(hiringCanRead([])).toBe(false));
  const valid = {
    title: "Artist",
    slug: "artist",
    deadline: "2026-11-10",
    agreement_template_id: "t",
    application_pipeline_id: "a",
    journey_pipeline_id: "j",
  };
  it.each([
    "title",
    "slug",
    "deadline",
    "agreement_template_id",
    "application_pipeline_id",
    "journey_pipeline_id",
  ] as const)("requires %s to publish", (key) =>
    expect(publishErrors({ ...valid, [key]: "" }, 1, true, "2026-11-08").length).toBeGreaterThan(0),
  );
  it("requires questions", () =>
    expect(publishErrors(valid, 0, true, "2026-11-08")).toContain("At least one question"));
  it("rejects nonunique slug", () =>
    expect(publishErrors(valid, 1, false, "2026-11-08")).toContain("Unique slug"));
  it("requires future date", () =>
    expect(publishErrors({ ...valid, deadline: "2026-11-08" }, 1, true, "2026-11-08")).toContain(
      "Deadline in the future",
    ));
  it("shows expired dates", () => expect(daysLeft("2026-11-07", "2026-11-08")).toBe("Expired"));
  it('shows exact remaining days',()=>expect(daysLeft('2026-11-10','2026-11-08')).toBe('2 days left'));
  it("validates knockout rating", () =>
    expect(
      questionSchema.safeParse({
        label: "Rating",
        help_text: null,
        type: "rating",
        options: null,
        max_length: null,
        required: true,
        section: "Thinking",
        sort_order: 0,
        knockout_rule: { operator: "less_than", value: 3 },
      }).success,
    ).toBe(true));
});
