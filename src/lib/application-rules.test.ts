import { describe, it, expect } from "vitest";
import {
  AUTOSAVE_MS,
  CV_LIMIT,
  PHOTO_LIMIT,
  RESEND_SECONDS,
  candidateSchema,
  candidateDraftSchema,
  phoneSchema,
  normalizeName,
  signatureIsMeaningful,
  nextApplicationStep,
  previousApplicationStep,
  answerError,
  fillAgreement,
  adminAccessAllowed,
  type ApplicationQuestion,
} from "./application-rules";
describe("Application requirements", () => {
  it("accepts the two Bangladesh phone formats only", () => {
    expect(phoneSchema.safeParse("+8801712345678").success).toBe(true);
    expect(phoneSchema.safeParse("01712345678").success).toBe(true);
    expect(phoneSchema.safeParse("+14155552671").success).toBe(false);
  });
  it("requires all personal fields", () => {
    expect(
      candidateSchema.safeParse({
        full_name: "Test Name",
        phone: "01712345678",
        whatsapp: "",
        area: "Dhaka",
        education: "",
        current_occupation: "Student",
      }).success,
    ).toBe(false);
  });
  it("allows incomplete personal details to autosave without allowing Next", () => {
    const partial = {
      full_name: "Test Name",
      phone: "",
      whatsapp: "",
      area: "",
      education: "",
      current_occupation: "",
    };
    expect(candidateDraftSchema.safeParse(partial).success).toBe(true);
    expect(candidateSchema.safeParse(partial).success).toBe(false);
  });
  it("sets a 2 MB photo limit", () => expect(PHOTO_LIMIT).toBe(2097152));
  it("sets a 5 MB PDF limit", () => expect(CV_LIMIT).toBe(5242880));
  it("waits 60 seconds before resending", () => expect(RESEND_SECONDS).toBe(60));
  it("autosaves after one second", () => expect(AUTOSAVE_MS).toBe(1000));
  it("skips disabled tasks in both directions", () => {
    expect(nextApplicationStep(4, false)).toBe(6);
    expect(previousApplicationStep(6, false)).toBe(4);
    expect(nextApplicationStep(4, true)).toBe(5);
  });
  it("matches names ignoring case and extra spaces", () =>
    expect(normalizeName("  TEST   Name ")).toBe(normalizeName("Test Name")));
  it("rejects tiny scribbles", () =>
    expect(
      signatureIsMeaningful(Array.from({ length: 20 }, (_, i) => ({ x: i / 2, y: i / 4 }))),
    ).toBe(false));
  it("accepts meaningful strokes", () =>
    expect(
      signatureIsMeaningful(
        Array.from({ length: 40 }, (_, i) => ({ x: i * 3, y: Math.sin(i) * 20 + 30 })),
      ),
    ).toBe(true));
  it("keeps task notes under 500 characters", () => {
    const q: ApplicationQuestion = {
      id: "q",
      label: "Note",
      type: "long_text",
      options: null,
      required: false,
      section: "Practical task",
      sort_order: 1,
      max_length: 500,
      help_text: null,
    };
    expect(answerError(q, "a".repeat(501))).not.toBeNull();
    expect(answerError(q, "a".repeat(500))).toBeNull();
  });
  it("renders agreement dates in Dhaka", () =>
    expect(
      fillAgreement(
        "{{date}} {{candidate_name}} {{job_title}} {{application_id}}",
        "A",
        "B",
        "ADM-1",
        new Date("2026-11-08T20:00:00Z"),
      ),
    ).toBe("9 November 2026 A B ADM-1"));
  it("blocks non-owner non-hiring admin access", () => {
    expect(adminAccessAllowed("client", false)).toBe(false);
    expect(adminAccessAllowed("member", false)).toBe(false);
    expect(adminAccessAllowed("manager", false)).toBe(false);
    expect(adminAccessAllowed("owner", false)).toBe(true);
    expect(adminAccessAllowed("client", true)).toBe(true);
  });
});
