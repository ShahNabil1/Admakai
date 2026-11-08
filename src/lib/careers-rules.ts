import { z } from "zod";
export const talentInterests = [
  "AI Video",
  "Editing",
  "Prompt Engineering",
  "Sound and Music",
  "Other",
] as const;
export const talentSchema = z.object({
  full_name: z.string().trim().min(2).max(150),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  phone: z.string().trim().max(40),
  portfolio_url: z.union([
    z.literal(""),
    z
      .string()
      .url()
      .max(1000)
      .refine((v) => /^https?:\/\//.test(v)),
  ]),
  interested_in: z.array(z.enum(talentInterests)).max(5),
  message: z.string().trim().max(3000),
});
export function daysUntil(deadline: string | null, now = new Date()) {
  if (!deadline) return null;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return Math.ceil(
    (Date.parse(`${deadline}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000,
  );
}
export function canApply(job: { status: string; deadline: string | null }, now = new Date()) {
  return job.status === "open" && (daysUntil(job.deadline, now) ?? 1) >= 0;
}
export function matchesJob(job: { type: string; work_mode: string }, filter: string) {
  return (
    filter === "All" ||
    job.type.replaceAll("_", "-") === filter.toLowerCase() ||
    job.work_mode === filter.toLowerCase()
  );
}
export function jobPosting(
  job: {
    title: string;
    summary: string | null;
    description: string | null;
    created_at: string;
    deadline: string | null;
    type: string;
    work_mode: string;
    status: string;
    slug: string;
  },
  now = new Date(),
) {
  if (!canApply(job, now)) return null;
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description || job.summary || job.title,
    datePosted: job.created_at,
    validThrough: job.deadline ? `${job.deadline}T23:59:59+06:00` : undefined,
    employmentType:
      job.type === "internship" ? "INTERN" : job.type === "freelance" ? "CONTRACTOR" : "FULL_TIME",
    hiringOrganization: { "@type": "Organization", name: "Admakai", sameAs: "https://admakai.com" },
    ...(job.work_mode === "remote" || job.work_mode === "hybrid"
      ? {
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: { "@type": "Country", name: "Bangladesh" },
        }
      : {
          jobLocation: {
            "@type": "Place",
            address: { "@type": "PostalAddress", addressLocality: "Dhaka", addressCountry: "BD" },
          },
        }),
  };
}
