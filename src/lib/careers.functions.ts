import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";
import { talentSchema } from "./careers-rules";
import { emptyInternshipVideo, type InternshipVideoSettings } from './internship-video';
export type CareerJob = Database["public"]["Tables"]["jobs"]["Row"];
export type CareerDetail = {
  job: CareerJob;
  stages: {
    key: string;
    candidate_label: string;
    expected_days: number | null;
    sort_order: number;
  }[];
  terms: string[];
};
const columns =
  "id,title,slug,type,work_mode,schedule_text,experience_level,schedule,summary,description,responsibilities,requirements,nice_to_have,benefits,tools,seats,deadline,status,cover_image_url,application_pipeline_id,journey_pipeline_id,agreement_template_id,task_enabled,task_brief,task_due_days,task_submission_type,created_at,updated_at,created_by";
function publicDb() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) throw new Error("Careers is temporarily unavailable. Please try again.");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (headers.get("Authorization") === `Bearer ${key}` && key.startsWith("sb_"))
          headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}
async function list(db: SupabaseClient<Database>, staff = false) {
  const jobs: CareerJob[] = [];
  for (let n = 0; ; n += 500) {
    const { data, error } = await db
      .from("jobs")
      .select(columns)
      .in("status", staff ? ["open", "draft"] : ["open"])
      .order("created_at", { ascending: false })
      .range(n, n + 499);
    if (error) throw new Error("Roles could not load. Please try again.");
    jobs.push(...data);
    if (data.length < 500) break;
  }
  return jobs;
}
async function detail(db: SupabaseClient<Database>, slug: string): Promise<CareerDetail | null> {
  const { data: job, error } = await db.from("jobs").select(columns).eq("slug", slug).maybeSingle();
  if (error) throw new Error("This role could not load.");
  if (!job) return null;
  const [stages, terms] = await Promise.all([
    job.journey_pipeline_id
      ? db
          .from("pipeline_stages")
          .select("key,candidate_label,expected_days,sort_order")
          .eq("pipeline_id", job.journey_pipeline_id)
          .order("sort_order")
      : Promise.resolve({ data: [], error: null }),
    job.agreement_template_id
      ? db
          .from("agreement_templates")
          .select("key_terms")
          .eq("id", job.agreement_template_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (stages.error || terms.error) throw new Error("The role details could not load.");
  return {
    job,
    stages: (stages.data ?? []).filter((s) =>
      ["onboarding", "learner", "project", "salary"].includes(s.key),
    ),
    terms: Array.isArray(terms.data?.key_terms)
      ? terms.data.key_terms.filter((v): v is string => typeof v === "string")
      : [],
  };
}
export const getCareerJobs = createServerFn({ method: "GET" }).handler(() => list(publicDb()));
export const getInternshipVideo = createServerFn({ method: 'GET' }).handler(async (): Promise<InternshipVideoSettings> => {
  const { data, error } = await publicDb().rpc('hiring_public_internship_video');
  if (error || !data?.[0]) return emptyInternshipVideo;
  return data[0];
});
export const getCareerDetail = createServerFn({ method: "GET" })
  .inputValidator(z.object({ slug: z.string().min(1).max(160) }))
  .handler(({ data }) => detail(publicDb(), data.slug));
export const getSignedInCareers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ slug: z.string().max(160).optional() }))
  .handler(async ({ data, context }) => {
    setResponseHeader("Cache-Control", "no-store");
    const role = await context.supabase.rpc("is_hiring_staff", { _user_id: context.userId });
    if (role.error) throw new Error("Hiring access could not be checked.");
    const staff = role.data === true;
    const applications = await context.supabase
      .from("applications")
      .select("id,job_id")
      .eq("candidate_id", context.userId);
    if (applications.error) throw new Error("Your applications could not load.");
    return {
      staff,
      jobs: staff ? await list(context.supabase, true) : [],
      detail: data.slug ? await detail(context.supabase, data.slug) : null,
      applications: applications.data,
    };
  });
export const joinTalentPool = createServerFn({ method: "POST" })
  .inputValidator(talentSchema)
  .handler(async ({ data }) => {
    const result = await publicDb().from("talent_pool").insert(data);
    if (result.error)
      return {
        ok: false,
        message:
          result.error.code === "23505"
            ? "You have already joined in the past 24 hours."
            : "Your details could not be saved. Please try again.",
      };
    return { ok: true, message: "Thanks, you are in our talent pool." };
  });
