import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";
import { questionSchema } from "./hiring-admin-rules";
type Tables = Database["public"]["Tables"];
export type HiringJob = Tables["jobs"]["Row"];
export type BankQuestion = Tables["question_bank"]["Row"];
export type HiringSettings = Tables["hiring_settings"]["Row"];
export type HiringTemplate = Tables["agreement_templates"]["Row"];
/** An update that changed no row (wrong id or no permission) is an error, not a success. */
const changedRow = <T>(r: { data: T[] | null; error: { message: string } | null }, what: string) => {
  if (r.error) throw new Error(r.error.message);
  if (!r.data?.length) throw new Error(`${what} was not changed. It may have been removed, or you lack permission.`);
  return r.data[0];
};
const checked = <T>(r: { data: T; error: { message: string } | null }) => {
  if (r.error) throw new Error(r.error.message);
  return r.data;
};
const id = z.object({ id: z.string().uuid() });
export const hiringWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    setResponseHeader("Cache-Control", "no-store");
    const db = context.supabase;
    const roles =
      checked(await db.from("hiring_user_roles").select("role").eq("user_id", context.userId))?.map(
        (r) => r.role,
      ) ?? [];
    if (!roles.some((r) => ["admin", "reviewer", "interviewer"].includes(r)))
      throw new Error("Hiring access required.");
    const [jobs, bank, questions, pipelines, stages, sources] = await Promise.all([
      db.from("jobs").select("*").order("updated_at", { ascending: false }),
      db
        .from("question_bank")
        .select("*")
        .neq("category", "__job_snapshot")
        .order("created_at", { ascending: false }),
      db
        .from("job_questions")
        .select("*,question_bank(label,help_text,max_length)")
        .eq('retired', false)
        .order("sort_order"),
      db.from("pipelines").select("*"),
      db.from("pipeline_stages").select("*").order("sort_order"),
      db.from("hiring_question_sources").select("*"),
    ]);
    const snapshots =
      checked(await db.from("hiring_question_snapshots").select("question_id")) ?? [];
    const counts: Record<string, number> = {};
    let offset = 0;
    for (;;) {
      const rows =
        checked(
          await db
            .from("applications")
            .select("job_id")
            .or("is_test.is.null,is_test.eq.false")
            .range(offset, offset + 999),
        ) ?? [];
      for (const row of rows) counts[row.job_id] = (counts[row.job_id] ?? 0) + 1;
      if (rows.length < 1000) break;
      offset += 1000;
    }
    const admin = roles.includes("admin");
    const templates = admin
      ? checked(
          await db.from("agreement_templates").select("*").order("version", { ascending: false }),
        )
      : [];
    const reviews = admin ? checked(await db.from("hiring_agreement_reviews").select("*")) : [];
    return {
      roles,
      jobs: checked(jobs) ?? [],
      bank: (checked(bank) ?? []).filter((b) => !snapshots.some((s) => s.question_id === b.id)),
      questions: checked(questions) ?? [],
      pipelines: checked(pipelines) ?? [],
      stages: checked(stages) ?? [],
      sources: checked(sources) ?? [],
      counts,
      templates: templates ?? [],
      reviews: reviews ?? [],
    };
  });
export type HiringWorkspace = Awaited<ReturnType<typeof hiringWorkspace>>;
async function requireAdmin(context: {
  supabase: Parameters<typeof adminCheck>[0];
  userId: string;
}) {
  if (
    !checked(await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }))
  )
    throw new Error("Hiring admin required.");
  setResponseHeader("Cache-Control", "no-store");
}
function adminCheck(db: import("@supabase/supabase-js").SupabaseClient<Database>) {
  return db;
}
const text = z.string().max(50000).nullable();
const jobSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().max(300),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(160),
  type: z.enum(["internship", "full_time", "freelance"]),
  work_mode: z.enum(["remote", "hybrid", "office"]),
  experience_level: z.enum(['none','junior','mid','senior']).optional(),
  schedule: z.enum(['day','evening','flexible']).optional(),
  schedule_text: text,
  seats: z.number().int().min(1).nullable(),
  deadline: z.string().nullable(),
  summary: text,
  description: text,
  responsibilities: z.array(z.string()),
  requirements: z.array(z.string()),
  nice_to_have: z.array(z.string()),
  benefits: z.array(z.string()),
  tools: z.array(z.string()),
  cover_image_url: text,
  application_pipeline_id: z.string().uuid().nullable(),
  journey_pipeline_id: z.string().uuid().nullable(),
  agreement_template_id: z.string().uuid().nullable(),
  task_enabled: z.boolean(),
  task_brief: text,
  task_due_days: z.number().int().min(1).nullable(),
  task_submission_type: z.enum(["link", "file"]),
});
export const saveHiringJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ job: jobSchema, questions: z.array(questionSchema) }))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    return checked(
      await context.supabase.rpc("hiring_save_job_filters", {
        _job: data.job,
        _questions: data.questions.map((q) => ({
          ...q,
          knockout_rule: q.knockout_rule
            ? { [q.knockout_rule.operator]: q.knockout_rule.value }
            : null,
        })),
      }),
    );
  });
export const duplicateHiringJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(id)
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    return checked(await context.supabase.rpc("hiring_admin_duplicate_job", { _id: data.id }));
  });
export const changeHiringJobStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(id.extend({ status: z.enum(["open", "closed"]) }))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    if (data.status === "open") {
      const errors = checked(
        await context.supabase.rpc("hiring_job_publish_errors", { _job_id: data.id }),
      );
      if (errors?.length) throw new Error(`Missing: ${errors.join(", ")}`);
    }
    changedRow(await context.supabase.from("jobs").update({ status: data.status }).eq("id", data.id).select("id"), "Job");
    return { ok: true };
  });
export const hiringSlugAvailable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ slug: z.string().max(160), id: z.string().uuid().nullable() }))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    let q = context.supabase.from("jobs").select("id").eq("slug", data.slug);
    if (data.id) q = q.neq("id", data.id);
    return (checked(await q) ?? []).length === 0;
  });
export const saveBankQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(questionSchema)
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const patch = {
      label: data.label,
      category: (data.category ?? data.section).toLowerCase(),
      type: data.type,
      help_text: data.help_text,
      options: data.options,
      max_length: data.max_length,
      knockout_rule: data.knockout_rule
        ? { [data.knockout_rule.operator]: data.knockout_rule.value }
        : null,
    };
    // Detach legacy linked questions before a bank edit so their help/length remain frozen too.
    if (data.id) {
      checked(await context.supabase.rpc("hiring_admin_freeze_bank", { _id: data.id }));
      changedRow(await context.supabase.from("question_bank").update(patch).eq("id", data.id).select("id"), "Question");
      return data.id;
    }
    return checked(await context.supabase.from("question_bank").insert(patch).select("id").single())
      ?.id;
  });
export const archiveBankQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(id.extend({ active: z.boolean() }))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    changedRow(
      await context.supabase
        .from("question_bank")
        .update({ is_active: data.active })
        .eq("id", data.id)
        .select("id"),
      "Question",
    );
    return { ok: true };
  });
export const updateDraftQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(id)
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    return checked(await context.supabase.rpc("hiring_admin_update_drafts", { _bank_id: data.id }));
  });
const templateSchema = z.object({
  name: z.string().trim().min(1).max(300),
  job_type: z.enum(["internship", "full_time", "freelance"]),
  body: z.string().min(1).max(100000),
  key_terms: z.array(z.string().trim().min(1).max(2000)).max(30),
  legal_review_pending: z.boolean(),
});
export const saveHiringTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(templateSchema)
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    return checked(
      await context.supabase.rpc("hiring_admin_agreement_version", { _template: data }),
    );
  });
export const moveHiringTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ fromIds: z.array(z.string().uuid()), toId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    checked(
      await context.supabase
        .from("jobs")
        .update({ agreement_template_id: data.toId })
        .in("agreement_template_id", data.fromIds)
        .in("status", ["draft", "open"]),
    );
    return { ok: true };
  });
export const markLegalReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(id.extend({ pending: z.boolean() }))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    checked(
      await context.supabase.from("hiring_agreement_reviews").upsert({
        template_id: data.id,
        legal_review_pending: data.pending,
        updated_at: new Date().toISOString(),
      }),
    );
    return { ok: true };
  });
export const readHiringSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const row = checked(
      await context.supabase.from("hiring_settings").select("*").eq("id", true).single(),
    );
    const previews: Record<string, string> = {};
    for (const key of ["pdf_logo_url", "authorised_signature_url"] as const) {
      if (row?.[key]) {
        const path = row[key];
        if (path && !/^https?:/.test(path))
          previews[key] =
            checked(await context.supabase.storage.from("hiring-assets").createSignedUrl(path, 900))
              ?.signedUrl ?? "";
      }
    }
    return { settings: row, previews };
  });
const settingsSchema = z.object({
  from_email: z.string().email(),
  reply_to: z.union([z.string().email(), z.literal("")]).nullable(),
  notify_admin_emails: z.array(z.string().email()),
  company_address: text,
  pdf_logo_url: text,
  authorised_signature_url: text,
  authorised_signatory_name: z.string().trim().min(1).max(100),
  authorised_signatory_title: z.string().trim().min(1).max(150),
  whatsapp_help_url: z
    .union([
      z
        .string()
        .url()
        .refine(
          (v) => /^https:\/\/(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)\//.test(v),
          "Use a WhatsApp link.",
        ),
      z.literal(""),
    ])
    .nullable(),
  internship_video_url: text,
  internship_video_poster_url: text,
  internship_video_title: text,
  google_login_enabled: z.boolean(),
});
export const saveHiringSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(settingsSchema)
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    changedRow(await context.supabase.from("hiring_settings").update(data).eq("id", true).select("id"), "Settings");
    return { ok: true };
  });
export const uploadHiringImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => {
    if (!(v instanceof FormData)) throw new Error("Invalid upload");
    return v;
  })
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const bucket = z.enum(["hiring-media", "hiring-assets"]).parse(data.get("bucket"));
    const file = data.get("file");
    if (!(file instanceof File) || file.size === 0 || file.size > 5 * 1024 * 1024)
      throw new Error("Choose an image under 5 MB.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
    const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp =
      new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
      new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
    if (!png && !jpg && !webp) throw new Error("Use a PNG, JPEG or WebP image.");
    const path = `${context.userId}/${crypto.randomUUID()}.${png ? "png" : jpg ? "jpg" : "webp"}`;
    checked(
      await context.supabase.storage.from(bucket).upload(path, bytes, {
        contentType: png ? "image/png" : jpg ? "image/jpeg" : "image/webp",
      }),
    );
    return {
      path,
      url:
        checked(await context.supabase.storage.from(bucket).createSignedUrl(path, bucket === "hiring-media" ? 3600 : 900))
          ?.signedUrl ?? "",
    };
  });
