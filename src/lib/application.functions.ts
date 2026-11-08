import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { decode } from "fast-png";
import { candidateDraftSchema, CV_LIMIT, PHOTO_LIMIT, type Answer } from "./application-rules";
import type { CareerJob } from "./careers.functions";
type Tables = Database["public"]["Tables"];
export type ApplicationRow = Tables["applications"]["Row"];
export type CandidateRow = Tables["candidates"]["Row"];
export type SignedRow = Pick<
  Tables["signed_agreements"]["Row"],
  | "id"
  | "application_id"
  | "template_id"
  | "template_version"
  | "signer_full_name"
  | "signature_path"
  | "accepted_terms"
  | "signed_at"
>;
const signedColumns =
  "id,application_id,template_id,template_version,signer_full_name,signature_path,accepted_terms,signed_at";
function checked<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
const slugSchema = z.object({ slug: z.string().min(1).max(160) });
export const applicationSettings = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env["SUPABASE_URL"],
    key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return { google_login_enabled: false, whatsapp_help_url: null };
  const db = createClient<Database>(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (h.get("Authorization") === `Bearer ${key}` && key.startsWith("sb_"))
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data } = await db.rpc("hiring_application_settings");
  const { data: help } = await db.rpc('hiring_public_help');
  return { google_login_enabled: data?.[0]?.google_login_enabled === true, whatsapp_help_url: help ?? null };
});
export const readApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(slugSchema)
  .handler(async ({ data, context }) => {
    setResponseHeader("Cache-Control", "no-store");
    const db = context.supabase;
    const job = checked(await db.from("jobs").select("*").eq("slug", data.slug).maybeSingle());
    if (!job) throw new Error("This role is not available to your account.");
    const staff = checked(await db.rpc("is_hiring_staff", { _user_id: context.userId })) === true;
    const app = checked(
      await db
        .from("applications")
        .select("*")
        .eq("job_id", job.id)
        .eq("candidate_id", context.userId)
        .maybeSingle(),
    );
    const eligible = checked(
      await db.rpc("hiring_can_apply", { _job_id: job.id, _user_id: context.userId }),
    );
    if (!eligible && !app?.submitted_at) throw new Error("Applications are closed for this role.");
    let candidate = checked(
      await db.from("candidates").select("*").eq("id", context.userId).maybeSingle(),
    );
    if (!candidate) {
      candidate = checked(
        await db
          .from("candidates")
          .insert({ id: context.userId, full_name: "" })
          .select("*")
          .single(),
      );
    }
    if (!candidate) throw new Error("Your candidate profile could not load.");
    const questions =
      checked(await db.rpc("hiring_application_questions", { _job_id: job.id })) ?? [];
    const templateRows = checked(await db.rpc("hiring_application_agreement", { _job_id: job.id }));
    const template = templateRows?.[0] ?? null;
    const answers: Record<string, Answer> = {};
    let signed: SignedRow | null = null;
    let signatureUrl: string | null = null;
    let photoUrl: string | null = null;
    if (app) {
      const rows =
        checked(
          await db
            .from("application_answers")
            .select("job_question_id,answer")
            .eq("application_id", app.id),
        ) ?? [];
      for (const row of rows) answers[row.job_question_id] = row.answer as Answer;
      signed = checked(
        await db
          .from("signed_agreements")
          .select(signedColumns)
          .eq("application_id", app.id)
          .maybeSingle(),
      );
      if (signed)
        signatureUrl =
          (await db.storage.from("signatures").createSignedUrl(signed.signature_path, 900)).data
            ?.signedUrl ?? null;
    }
    if (candidate.photo_url)
      photoUrl =
        (await db.storage.from("task-files").createSignedUrl(candidate.photo_url, 900)).data
          ?.signedUrl ?? null;
    const stages =
      checked(
        await db
          .from("pipeline_stages")
          .select("key,candidate_label,sort_order,is_negative")
          .eq("pipeline_id", job.application_pipeline_id)
          .order("sort_order"),
      ) ?? [];
    return {
      job: job as CareerJob,
      staff,
      application: app,
      candidate,
      questions,
      template,
      answers,
      signed,
      signatureUrl,
      photoUrl,
      stages,
      userId: context.userId,
    };
  });
export type ApplicationData = Awaited<ReturnType<typeof readApplication>>;
export const saveCandidate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(candidateDraftSchema)
  .handler(async ({ data, context }) => {
    setResponseHeader("Cache-Control", "no-store");
    checked(await context.supabase.from("candidates").update(data).eq("id", context.userId));
    return { ok: true };
  });
export const saveApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      jobId: z.string().uuid(),
      step: z.number().int().min(2).max(7),
      answers: z.record(
        z.string().uuid(),
        z.union([z.string().max(3000), z.number(), z.array(z.string().max(200)).max(50), z.null()]),
      ),
      cvPath: z.string().max(500).nullable(),
    }),
  )
  .handler(async ({ data, context }) => {
    setResponseHeader("Cache-Control", "no-store");
    const app = checked(
      await context.supabase.rpc("hiring_save_progress", {
        _job_id: data.jobId,
        _step: data.step,
        _answers: data.answers,
        _cv_path: data.cvPath ?? "",
      }),
    );
    if (!app) throw new Error("Your application could not save.");
    return app;
  });
export const uploadApplicationFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value: unknown) => {
    if (!(value instanceof FormData)) throw new Error("Invalid upload");
    return value;
  })
  .handler(async ({ data, context }) => {
    setResponseHeader("Cache-Control", "no-store");
    const applicationId = z.string().uuid().parse(data.get("applicationId"));
    const kind = z.enum(["cv", "photo", "signature"]).parse(data.get("kind"));
    const file = data.get("file");
    if (!(file instanceof File) || file.size === 0) throw new Error("Choose a file.");
    const app = checked(
      await context.supabase
        .from("applications")
        .select("id,candidate_id,is_draft")
        .eq("id", applicationId)
        .eq("candidate_id", context.userId)
        .single(),
    );
    if (!app || !app.is_draft) throw new Error("Submitted files cannot be changed.");
    if (file.size > (kind === "cv" ? CV_LIMIT : PHOTO_LIMIT))
      throw new Error(kind === "cv" ? "PDF must be under 5 MB." : "Image must be under 2 MB.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    let extension = "png";
    let mime = "image/png";
    if (kind === "cv") {
      if (
        new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-" ||
        file.type !== "application/pdf"
      )
        throw new Error("Upload a PDF file.");
      extension = "pdf";
      mime = "application/pdf";
    } else {
      const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
      const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      const webp =
        new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
        new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
      if (!png && !jpg && !webp) throw new Error("Upload a PNG, JPEG or WebP image.");
      extension = jpg ? "jpg" : webp ? "webp" : "png";
      mime = jpg ? "image/jpeg" : webp ? "image/webp" : "image/png";
      if (kind === "signature") {
        if (!png) throw new Error("Signature must be a PNG.");
        const width =
            (bytes[16] ?? 0) * 16777216 +
            (bytes[17] ?? 0) * 65536 +
            (bytes[18] ?? 0) * 256 +
            (bytes[19] ?? 0),
          height =
            (bytes[20] ?? 0) * 16777216 +
            (bytes[21] ?? 0) * 65536 +
            (bytes[22] ?? 0) * 256 +
            (bytes[23] ?? 0);
        if (width * height > 2000000) throw new Error("Signature image too large.");
        const image = decode(bytes);
        if (image.channels !== 4) throw new Error("Use a transparent signature image.");
        let count = 0,
          minX = image.width,
          maxX = 0,
          minY = image.height,
          maxY = 0;
        for (let y = 0; y < image.height; y++)
          for (let x = 0; x < image.width; x++) {
            const i = (y * image.width + x) * 4;
            if (Number(image.data[i + 3]) > 30) {
              count++;
              minX = Math.min(minX, x);
              maxX = Math.max(maxX, x);
              minY = Math.min(minY, y);
              maxY = Math.max(maxY, y);
            }
          }
        if (count < 120 || maxX - minX < 35 || maxY - minY < 10)
          throw new Error("Please draw a fuller signature.");
      }
    }
    const path = `${context.userId}/${app.id}/${kind === "photo" ? `photo-${crypto.randomUUID()}.${extension}` : kind === "cv" ? "cv.pdf" : "signature.png"}`;
    if (kind === "signature") {
      // The fixed signature path is privileged only after ownership, draft and PNG checks above.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      checked(
        await supabaseAdmin.storage
          .from("signatures")
          .upload(path, bytes, { contentType: mime, upsert: true }),
      );
    } else
      checked(
        await context.supabase.storage
          .from(kind === "cv" ? "resumes" : "task-files")
          .upload(path, bytes, { contentType: mime, upsert: kind === "cv" }),
      );
    if (kind === "photo")
      checked(
        await context.supabase
          .from("candidates")
          .update({ photo_url: path })
          .eq("id", context.userId),
      );
    const signedUrl =
      kind === "signature" || kind === "photo"
        ? ((
            await context.supabase.storage
              .from(kind === "signature" ? "signatures" : "task-files")
              .createSignedUrl(path, 900)
          ).data?.signedUrl ?? null)
        : null;
    return { path, signedUrl };
  });
export const removeApplicationCv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const app = checked(
      await context.supabase
        .from("applications")
        .select("id,candidate_id,is_draft,cv_path")
        .eq("id", data.id)
        .eq("candidate_id", context.userId)
        .single(),
    );
    if (!app || !app.is_draft) throw new Error("Submitted CV cannot be removed.");
    if (app.cv_path) checked(await context.supabase.storage.from("resumes").remove([app.cv_path]));
    return { ok: true };
  });
export const recordApplicationSignature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      name: z.string().trim().min(2).max(100),
      path: z.string().max(500),
      terms: z.array(z.string().max(2000)).max(30),
      userAgent: z.string().max(1000),
    }),
  )
  .handler(async ({ data, context }) => {
    setResponseHeader("Cache-Control", "no-store");
    checked(
      await context.supabase.rpc("record_signature", {
        _application_id: data.id,
        _signer_full_name: data.name,
        _signature_path: data.path,
        _accepted_terms: data.terms,
        _user_agent: data.userAgent,
      }),
    );
    const signed = checked(
      await context.supabase
        .from("signed_agreements")
        .select(signedColumns)
        .eq("application_id", data.id)
        .single(),
    );
    if (!signed) throw new Error("Your signature could not save.");
    return signed;
  });
export const saveApplicationTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      url: z.union([
        z
          .string()
          .url()
          .max(2048)
          .refine((v) => /^https?:\/\//.test(v)),
        z.null(),
      ]),
    }),
  )
  .handler(async ({ data, context }) => {
    setResponseHeader("Cache-Control", "no-store");
    checked(
      await context.supabase.rpc("submit_task", { _application_id: data.id, _url: data.url ?? "" }),
    );
    return { ok: true };
  });
export const submitApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid(), confirmed: z.literal(true) }))
  .handler(async ({ data, context }) => {
    setResponseHeader("Cache-Control", "no-store");
    checked(await context.supabase.rpc("submit_application", { _application_id: data.id }));
    // The caller-scoped RPC commits first; delivery failures must never undo submission.
    try {
      const { deliverSubmittedApplication } = await import('./hiring-delivery.server');
      const delivery = await deliverSubmittedApplication(data.id);
      return { ok: true, delivery };
    } catch {
      console.error('Hiring post-submission delivery failed');
      return { ok: true, delivery: { pdf: 'failed', email: 'failed' } };
    }
  });
