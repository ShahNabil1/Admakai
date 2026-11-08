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
  questionStep,
  type ApplicationQuestion,
  APPLICANT_SAVE_ERROR,
  applicantDbMessage,
  applicantErrorText,
} from "./application-rules";
describe("Applicant-facing save errors", () => {
  it("hides raw permission errors behind the friendly WhatsApp message", () => {
    expect(APPLICANT_SAVE_ERROR).toBe("We could not save this step. Please try again, or message us on WhatsApp if it keeps happening.");
    expect(applicantDbMessage({ code: "42501", message: "permission denied for table applications" })).toBe(APPLICANT_SAVE_ERROR);
    expect(applicantErrorText(new Error("permission denied for table applications"))).toBe(APPLICANT_SAVE_ERROR);
  });
  it("keeps intentional SQL guidance readable", () => {
    expect(applicantDbMessage({ code: "P0001", message: "Upload your passport size photo first" })).toBe("Upload your passport size photo first");
    expect(applicantErrorText(new Error("Choose and crop your passport size photo."))).toBe("Choose and crop your passport size photo.");
  });
});
describe("Application requirements", () => {
  it('places optional Your work questions in step 4 and Last thing in answers', () => {
    const q = { id: 'q', label: 'Creative work', type: 'long_text', options: null, required: false, section: 'Your work', sort_order: 1, max_length: 400, help_text: null };
    expect(questionStep(q)).toBe(4); expect(questionStep({...q,section:'Last thing'})).toBe(3);
  });
  it('enforces beginner creator limits of 600 and 400 characters', () => {
    const q = { id: 'q', label: 'Idea', type: 'long_text', options: null, required: true, section: 'About you as a creator', sort_order: 1, max_length: 600, help_text: null };
    expect(answerError(q, 'a'.repeat(600))).toBeNull(); expect(answerError(q, 'a'.repeat(601))).not.toBeNull();
    expect(answerError({...q,max_length:400}, 'a'.repeat(401))).not.toBeNull();
  });
  it('requires English-letter NID names', () => {
    const fields={full_name:'নাবিল',phone:'01712345678',whatsapp:'',area:'Dhaka',education:'College',current_occupation:'Student'};
    expect(candidateSchema.safeParse(fields).success).toBe(false);
    expect(candidateSchema.safeParse({...fields,full_name:"Md. Nabil Rahman"}).success).toBe(true);
  });
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
