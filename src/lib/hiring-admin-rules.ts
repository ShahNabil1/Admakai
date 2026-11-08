import { z } from "zod";
export const jobTypes = ["internship", "full_time", "freelance"];
export const questionTypes = [
  "short_text",
  "long_text",
  "single_choice",
  "multi_choice",
  "yes_no",
  "rating",
  "link",
  "file",
  "video_link",
];
export const sections = ["Commitment", "Tools", "Thinking", "Setup", "Portfolio", "Other"];
export const hiringCanWrite = (roles: string[]) => roles.includes("admin");
export const hiringCanRead = (roles: string[]) =>
  roles.some((r) => ["admin", "reviewer", "interviewer"].includes(r));
export const slugify = (v: string) =>
  v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export const questionSchema = z
  .object({
    id: z.string().uuid().optional(),
    source_id: z.string().uuid().nullable().optional(),
    label: z.string().trim().min(1).max(2000),
    help_text: z.string().max(3000).nullable(),
    type: z.enum(questionTypes as [string, ...string[]]),
    options: z.array(z.string().trim().min(1).max(200)).max(50).nullable(),
    max_length: z.number().int().min(1).max(3000).nullable(),
    required: z.boolean(),
    section: z.string().max(100),
    category: z.string().max(100).optional(),
    sort_order: z.number().int().min(0),
    knockout_rule: z
      .object({
        operator: z.enum(["equals", "less_than", "contains"]),
        value: z.union([z.string(), z.number()]),
      })
      .nullable(),
  })
  .superRefine((q, c) => {
    if (["single_choice", "multi_choice"].includes(q.type) && (!q.options || q.options.length < 2))
      c.addIssue({ code: "custom", path: ["options"], message: "Add at least two options." });
  });
export type HiringQuestion = z.infer<typeof questionSchema>;
export function publishErrors(
  j: {
    title: string;
    slug: string;
    deadline: string | null;
    agreement_template_id: string | null;
    application_pipeline_id: string | null;
    journey_pipeline_id: string | null;
  },
  count: number,
  unique: boolean,
  today: string,
) {
  return [
    !j.title.trim() && "Title",
    (!j.slug.trim() || !unique) && "Unique slug",
    (!j.deadline || j.deadline <= today) && "Deadline in the future",
    count < 1 && "At least one question",
    !j.agreement_template_id && "Agreement template",
    !j.application_pipeline_id && "Application pipeline",
    !j.journey_pipeline_id && "Journey pipeline",
  ].filter((x): x is string => typeof x === "string");
}
export const dhakaDay = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export function daysLeft(deadline: string | null, today = dhakaDay()) {
  if (!deadline) return "No deadline";
  const n = Math.round((Date.parse(deadline) - Date.parse(today)) / 86400000);
  return n < 0 ? "Expired" : `${n} days left`;
}
