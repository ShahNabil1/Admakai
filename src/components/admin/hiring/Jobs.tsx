import { useState, useEffect } from "react";
import { JobFaqEditor } from './JobFaqEditor';
import { jobFaqs } from '@/lib/job-page-rules';
import { Link, useNavigate, useBlocker } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Plus,
  Save,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { Modal, Pill, fmtDate, useConfirm } from "../ui";
import { ApplicationQuestion } from "@/components/careers/ApplicationQuestion";
import { HiringRichText } from "@/components/careers/HiringRichText";
import { fillAgreement, type Answer } from "@/lib/application-rules";
import {
  daysLeft,
  dhakaDay,
  jobTypes,
  publishErrors,
  sections,
  slugify,
  type HiringQuestion,
} from "@/lib/hiring-admin-rules";
import {
  changeHiringJobStatus,
  duplicateHiringJob,
  saveHiringJob,
  hiringSlugAvailable,
  type HiringJob,
  type HiringWorkspace,
} from "@/lib/hiring-admin.functions";
import { Action, ImageUpload, ListEditor, RichEditor } from "./Controls";
import { QuestionForm, emptyQuestion, readKnockout } from "./QuestionForm";
const publicLink = (slug: string) =>
  `${window.location.origin}/careers/${encodeURIComponent(slug)}`;
export function JobsList({
  data,
  admin,
  reload,
}: {
  data: HiringWorkspace;
  admin: boolean;
  reload: () => Promise<void>;
}) {
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [type, setType] = useState("");
  const duplicate = useServerFn(duplicateHiringJob),
    change = useServerFn(changeHiringJobStatus),
    navigate = useNavigate();
  const { confirm, node } = useConfirm();
  const rows = data.jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(search.toLowerCase()) &&
      (!status || j.status === status) &&
      (!type || j.type === type),
  );
  return (
    <>
      <header className="admin-head">
        <div>
          <p className="admin-eyebrow">Hiring</p>
          <h1>Jobs</h1>
        </div>
        {admin && (
          <Action
            primary
            onClick={() => void navigate({ to: "/admin/hiring/jobs/$id", params: { id: "new" } })}
          >
            <Plus size={15} />
            New job
          </Action>
        )}
      </header>
      <div className="hiring-filters">
        <input
          type="search"
          aria-label="Search jobs"
          placeholder="Search by title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {["draft", "open", "closed"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select aria-label="Job type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {jobTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="hiring-table-wrap">
        <table className="hiring-table">
          <thead>
            <tr>
              {[
                "Title",
                "Type",
                "Work mode",
                "Status",
                "Deadline",
                "Applications",
                "Seats",
                "Last updated",
                "Actions",
              ].map((t) => (
                <th key={t}>{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((j) => (
              <tr key={j.id}>
                <td>
                  <Link to="/admin/hiring/jobs/$id" params={{ id: j.id }}>
                    {j.title || "Untitled draft"}
                  </Link>
                </td>
                <td>{j.type}</td>
                <td>{j.work_mode}</td>
                <td>
                  <Pill value={j.status} />
                </td>
                <td>
                  {j.deadline ?? "—"}
                  <br />
                  <small>{daysLeft(j.deadline)}</small>
                </td>
                <td>{data.counts[j.id] ?? 0}</td>
                <td>{j.seats ?? "—"}</td>
                <td>{fmtDate(j.updated_at)}</td>
                <td>
                  <div className="admin-actions">
                    <Link
                      to="/admin/hiring/jobs/$id"
                      params={{ id: j.id }}
                      className="admin-btn-ghost"
                    >
                      {admin ? "Edit" : "View"}
                    </Link>
                    <a
                      href={publicLink(j.slug)}
                      className="admin-btn-ghost"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Preview
                      <ExternalLink size={12} />
                    </a>
                    <Action
                      title="Copy public link"
                      onClick={() =>
                        void navigator.clipboard
                          .writeText(publicLink(j.slug))
                          .then(() => toast.success("Link copied"))
                      }
                    >
                      <Copy size={13} />
                    </Action>
                    {admin && (
                      <>
                        <Action
                          onClick={() =>
                            confirm({
                              title: "Duplicate job?",
                              description: "Copy the job and every question into a new draft.",
                              confirmLabel: "Duplicate",
                              run: async () => {
                                try {
                                  const id = await duplicate({ data: { id: j.id } });
                                  await reload();
                                  if (id)
                                    await navigate({
                                      to: "/admin/hiring/jobs/$id",
                                      params: { id },
                                    });
                                  return true;
                                } catch (e) {
                                  toast.error(
                                    e instanceof Error ? e.message : "Could not duplicate",
                                  );
                                  return false;
                                }
                              },
                            })
                          }
                        >
                          Duplicate
                        </Action>
                        <Action
                          onClick={() =>
                            confirm({
                              title: j.status === "open" ? "Close job?" : "Reopen job?",
                              description:
                                j.status === "open"
                                  ? "New applications will stop."
                                  : "Publishing requirements will be checked.",
                              confirmLabel: j.status === "open" ? "Close" : "Reopen",
                              run: async () => {
                                try {
                                  await change({
                                    data: {
                                      id: j.id,
                                      status: j.status === "open" ? "closed" : "open",
                                    },
                                  });
                                  await reload();
                                  return true;
                                } catch (e) {
                                  toast.error(e instanceof Error ? e.message : "Could not update");
                                  return false;
                                }
                              },
                            })
                          }
                        >
                          {j.status === "open" ? "Close" : "Reopen"}
                        </Action>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="admin-empty p-6">No jobs match.</p>}
      </div>
      {node}
    </>
  );
}
function blankJob(data: HiringWorkspace): HiringJob {
  return {
    id: crypto.randomUUID(),
    title: "",
    slug: "",
    type: "internship",
    work_mode: "hybrid",
    experience_level: 'none',
    schedule: 'evening',
    schedule_text: "",
    seats: null,
    deadline: null,
    summary: "",
    description: "",
    responsibilities: [],
    requirements: [],
    nice_to_have: [],
    benefits: [],
    tools: [],
    who_its_for: null,
    job_faqs: [],
    status: "draft",
    cover_image_url: null,
    application_pipeline_id: data.pipelines.find((p) => p.kind === "application")?.id ?? "",
    journey_pipeline_id: null,
    agreement_template_id: null,
    task_enabled: false,
    task_brief: "",
    task_due_days: 3,
    task_submission_type: "link",
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
export function JobEditor({
  data,
  id,
  admin,
  reload,
}: {
  data: HiringWorkspace;
  id: string;
  admin: boolean;
  reload: () => Promise<void>;
}) {
  const existing = data.jobs.find((j) => j.id === id);
  const [job, setJob] = useState(() => existing ?? blankJob(data));
  const initialQuestions = data.questions
    .filter((q) => q.job_id === id)
    .map((q) => ({
      id: q.id,
      label: q.label_override ?? q.question_bank?.label ?? "",
      help_text: q.question_bank?.help_text ?? "",
      max_length: q.question_bank?.max_length ?? 3000,
      type: q.type,
      options: Array.isArray(q.options)
        ? q.options.filter((v): v is string => typeof v === "string")
        : [],
      required: q.required,
      section: q.section ?? "Other",
      sort_order: q.sort_order,
      source_id:
        data.sources.find((s) => s.job_question_id === q.id)?.bank_question_id ??
        (data.bank.some((b) => b.id === q.question_id) ? q.question_id : null),
      knockout_rule: readKnockout(q.knockout_rule),
    }));
  const [questions, setQuestions] = useState<HiringQuestion[]>(initialQuestions),
    [tab, setTab] = useState("Details"),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [unique, setUnique] = useState(true),
    [errors, setErrors] = useState<string[]>([]),
    [edit, setEdit] = useState<HiringQuestion | null>(null),
    [bankOpen, setBankOpen] = useState(false),
    [preview, setPreview] = useState(false),
    [answers, setAnswers] = useState<Record<string, Answer>>({}),
    [drag, setDrag] = useState<number | null>(null);
  const save = useServerFn(saveHiringJob),
    change = useServerFn(changeHiringJobStatus),
    slugCheck = useServerFn(hiringSlugAvailable),
    navigate = useNavigate();
  const { confirm, node } = useConfirm();
  // Router's resolver is handled below to keep the same confirmation language across exits.
  const blocker = useBlocker({
    shouldBlockFn: () => dirty,
    enableBeforeUnload: dirty,
    withResolver: true,
  });
  useEffect(() => {
    if (blocker.status === "blocked")
      confirm({
        title: "Leave without saving?",
        description: "Your unsaved job changes will be lost.",
        confirmLabel: "Leave",
        run: async () => {
          setDirty(false);
          blocker.proceed?.();
        },
      });
  }, [blocker.status]);
  useEffect(() => {
    if (!admin || !job.slug) return;
    let active = true;
    const timer = setTimeout(
      () =>
        void slugCheck({ data: { slug: job.slug, id: id === "new" ? null : id } })
          .then((v) => {
            if (active) setUnique(v);
          })
          .catch(() => {
            if (active) setUnique(false);
          }),
      350,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [job.slug, id, admin]);
  const patch = (p: Partial<HiringJob>) => {
    setJob({ ...job, ...p });
    setDirty(true);
  };
  const setQs = (q: HiringQuestion[]) => {
    setQuestions(q.map((v, i) => ({ ...v, sort_order: i })));
    setDirty(true);
  };
  const doSave = async () => {
    setBusy(true);
    try {
      const saved = await save({
        data: {
          job: {
            ...job,
            slug: job.slug || `draft-${job.id}`,
            type: job.type as "internship" | "full_time" | "freelance",
            work_mode: job.work_mode as "remote" | "hybrid" | "office",
            experience_level: job.experience_level as 'none' | 'junior' | 'mid' | 'senior',
            schedule: job.schedule as 'day' | 'evening' | 'flexible',
            task_submission_type: job.task_submission_type === "file" ? "file" : "link",
            who_its_for: job.who_its_for ?? null,
            job_faqs: jobFaqs(job.job_faqs),
          },
          questions,
        },
      });
      setDirty(false);
      await reload();
      toast.success("Job saved");
      if (id === "new" && saved)
        await navigate({ to: "/admin/hiring/jobs/$id", params: { id: saved }, replace: true });
      return saved;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save job");
      return null;
    } finally {
      setBusy(false);
    }
  };
  const publish = async () => {
    const missing =
      job.status === "open" ? [] : publishErrors(job, questions.length, unique, dhakaDay());
    setErrors(missing);
    if (missing.length) return;
    const saved = dirty || id === "new" ? await doSave() : job.id;
    if (!saved) return;
    try {
      await change({ data: { id: saved, status: job.status === "open" ? "closed" : "open" } });
      setJob({ ...job, status: job.status === "open" ? "closed" : "open" });
      await reload();
      toast.success(job.status === "open" ? "Job closed" : "Job published");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Status could not change");
    }
  };
  const template = data.templates.find((t) => t.id === job.agreement_template_id);
  const bankIds = new Set(questions.map((q) => q.source_id));
  const move = (i: number, n: number) => {
    if (n < 0 || n >= questions.length) return;
    const qs = [...questions];
    const [q] = qs.splice(i, 1);
    if (q) qs.splice(n, 0, q);
    setQs(qs);
  };
  if (id !== "new" && !existing) return <p>Job not found.</p>;
  return (
    <>
      <Link className="admin-btn-ghost hiring-back" to="/admin/hiring/jobs">
        <ArrowLeft size={14} />
        Back to jobs
      </Link>
      <header className="admin-head">
        <div>
          <p className="admin-eyebrow">{admin ? "Job editor" : "Read only"}</p>
          <h1>{job.title || "New job"}</h1>
          <Pill value={job.status} />
        </div>
        <div className="admin-actions">
          {admin && (
            <Action primary disabled={busy} onClick={() => void doSave()}>
              <Save size={15} />
              Save
            </Action>
          )}
          <a
            href={publicLink(job.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn-ghost"
          >
            Preview
            <ExternalLink size={14} />
          </a>
          {admin && (
            <Action disabled={busy} onClick={() => void publish()}>
              {job.status === "open" ? "Close" : "Publish"}
            </Action>
          )}
        </div>
      </header>
      {errors.length > 0 && (
        <div className="admin-alert hiring-errors">
          <strong>Missing before publishing</strong>
          <ul>
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      <nav className="hiring-nav">
        {["Details", "Questions", "Practical task", "Agreement", "Pipeline"].map((t) => (
          <Action key={t} primary={tab === t} onClick={() => setTab(t)}>
            {t}
          </Action>
        ))}
      </nav>
      {tab === "Details" && (
        <fieldset className="admin-form" disabled={!admin}>
          <div className="admin-form-row">
            <label>
              Title
              <input
                value={job.title}
                onChange={(e) =>
                  patch({
                    title: e.target.value,
                    ...(!existing && (!job.slug || job.slug === slugify(job.title))
                      ? { slug: slugify(e.target.value) }
                      : {}),
                  })
                }
              />
            </label>
            <label>
              Slug
              <input value={job.slug} onChange={(e) => patch({ slug: slugify(e.target.value) })} />
              {!unique && <span className="application-error">This slug is already used.</span>}
            </label>
            <label>
              Type
              <select value={job.type} onChange={(e) => patch({ type: e.target.value })}>
                {jobTypes.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Work mode
              <select value={job.work_mode} onChange={(e) => patch({ work_mode: e.target.value })}>
                {["remote", "hybrid", "office"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Schedule
              <input
                value={job.schedule_text ?? ""}
                onChange={(e) => patch({ schedule_text: e.target.value })}
              />
            </label>
            <label>
              Experience level
              <select value={job.experience_level} onChange={e=>patch({experience_level:e.target.value})}>
                <option value="none">No experience needed</option><option value="junior">Junior</option><option value="mid">Mid</option><option value="senior">Senior</option>
              </select>
            </label>
            <label>
              Schedule filter
              <select value={job.schedule} onChange={e=>patch({schedule:e.target.value})}>
                <option value="day">Day</option><option value="evening">Evening</option><option value="flexible">Flexible</option>
              </select>
            </label>
            <label>
              Seats
              <input
                type="number"
                min={1}
                value={job.seats ?? ""}
                onChange={(e) => patch({ seats: e.target.value ? Number(e.target.value) : null })}
              />
            </label>
            <label>
              Deadline
              <input
                type="date"
                value={job.deadline ?? ""}
                onChange={(e) => patch({ deadline: e.target.value || null })}
              />
            </label>
          </div>
          <label>
            Summary
            <textarea
              rows={3}
              value={job.summary ?? ""}
              onChange={(e) => patch({ summary: e.target.value })}
            />
          </label>
          <RichEditor
            label="Description"
            value={job.description ?? ""}
            onChange={(description) => patch({ description })}
            disabled={!admin}
          />
          {(["responsibilities", "requirements", "nice_to_have", "benefits", "tools"] as const).map(
            (k) => (
              <ListEditor
                key={k}
                label={k.replaceAll("_", " ")}
                values={job[k]}
                onChange={(values) => patch({ [k]: values })}
                disabled={!admin}
              />
            ),
          )}
          <label>
            Who this is for
            <textarea
              rows={4}
              maxLength={5000}
              value={job.who_its_for ?? ""}
              onChange={(e) => patch({ who_its_for: e.target.value })}
              disabled={!admin}
            />
          </label>
          <JobFaqEditor value={jobFaqs(job.job_faqs)} onChange={(job_faqs) => patch({ job_faqs })} disabled={!admin} />
          {admin && (
            <ImageUpload
              label="Cover image"
              bucket="hiring-media"
              value={job.cover_image_url}
              onChange={(cover_image_url) => patch({ cover_image_url })}
            />
          )}
        </fieldset>
      )}
      {tab === "Questions" && (
        <>
          <div className="admin-actions">
            {admin && (
              <>
                <Action onClick={() => setBankOpen(true)}>Add from bank</Action>
                <Action onClick={() => setEdit(emptyQuestion())}>
                  <Plus size={14} />
                  New question
                </Action>
              </>
            )}
            <Action onClick={() => setPreview(true)}>Preview form</Action>
          </div>
          {sections.map((section) => {
            const grouped = questions.filter(
              (q) => q.section.toLowerCase() === section.toLowerCase(),
            );
            return grouped.length ? (
              <section key={section}>
                <h2 className="admin-sub">{section}</h2>
                {grouped.map((q) => {
                  const i = questions.indexOf(q);
                  return (
                    <article
                      className="hiring-question-card"
                      key={q.id ?? i}
                      draggable={admin}
                      onDragStart={() => setDrag(i)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (drag !== null) move(drag, i);
                        setDrag(null);
                      }}
                    >
                      <header>
                        <strong>{q.label}</strong>
                        <small>
                          {q.type}
                          {q.knockout_rule && <span className="admin-pill">Knockout</span>}
                        </small>
                      </header>
                      <div className="admin-actions">
                        <label className="hiring-check">
                          <input
                            type="checkbox"
                            disabled={!admin}
                            checked={q.required}
                            onChange={(e) =>
                              setQs(
                                questions.map((v, n) =>
                                  n === i ? { ...v, required: e.target.checked } : v,
                                ),
                              )
                            }
                          />
                          Required
                        </label>
                        {admin && (
                          <>
                            <Action onClick={() => setEdit(q)}>Edit</Action>
                            <Action
                              title="Remove question"
                              onClick={() =>
                                confirm({
                                  title: "Remove question?",
                                  description: "Remove this question from this job only.",
                                  confirmLabel: "Remove",
                                  run: async () => setQs(questions.filter((_, n) => n !== i)),
                                })
                              }
                            >
                              <Trash2 size={14} />
                            </Action>
                            <Action
                              title="Move question up"
                              disabled={i === 0}
                              onClick={() => move(i, i - 1)}
                            >
                              <ArrowUp size={14} />
                            </Action>
                            <Action
                              title="Move question down"
                              disabled={i === questions.length - 1}
                              onClick={() => move(i, i + 1)}
                            >
                              <ArrowDown size={14} />
                            </Action>
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </section>
            ) : null;
          })}
        </>
      )}
      {tab === "Practical task" && (
        <fieldset disabled={!admin} className="admin-form">
          <label className="hiring-check">
            <input
              type="checkbox"
              checked={job.task_enabled}
              onChange={(e) => patch({ task_enabled: e.target.checked })}
            />
            Enable practical task
          </label>
          {job.task_enabled && (
            <>
              <RichEditor
                label="Task brief"
                disabled={!admin}
                value={job.task_brief ?? ""}
                onChange={(task_brief) => patch({ task_brief })}
              />
              <label>
                Due within days after shortlisting
                <input
                  type="number"
                  min={1}
                  value={job.task_due_days ?? 3}
                  onChange={(e) => patch({ task_due_days: Number(e.target.value) })}
                />
              </label>
              <label>
                Submission type
                <select
                  value={job.task_submission_type ?? "link"}
                  onChange={(e) => patch({ task_submission_type: e.target.value })}
                >
                  <option>link</option>
                  <option>file</option>
                </select>
              </label>
            </>
          )}
        </fieldset>
      )}
      {tab === "Agreement" && (
        <div className="admin-form">
          {admin ? (
            <label>
              Agreement template
              <select
                value={job.agreement_template_id ?? ""}
                onChange={(e) => patch({ agreement_template_id: e.target.value || null })}
              >
                <option value="">Choose a template</option>
                {data.templates
                  .filter(
                    (t) =>
                      !data.templates.some(
                        (v) =>
                          v.name === t.name && v.job_type === t.job_type && v.version > t.version,
                      ),
                  )
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} · v{t.version}
                    </option>
                  ))}
              </select>
            </label>
          ) : (
            <p>Agreement selection is managed by hiring admins.</p>
          )}
          {template && (
            <>
              <HiringRichText
                text={fillAgreement(
                  template.body,
                  "Sample Applicant",
                  job.title,
                  "SAMPLE-0001",
                  new Date(),
                )}
              />
              {Array.isArray(template.key_terms) &&
                template.key_terms
                  .filter((t): t is string => typeof t === "string")
                  .map((t) => (
                    <label className="hiring-check" key={t}>
                      <input type="checkbox" />
                      {t}
                    </label>
                  ))}
            </>
          )}
        </div>
      )}
      {tab === "Pipeline" && (
        <div className="admin-form">
          {(["application", "journey"] as const).map((kind) => {
            const field =
              kind === "application" ? "application_pipeline_id" : "journey_pipeline_id";
            return (
              <section key={kind}>
                <label>
                  {kind} pipeline
                  <select
                    disabled={!admin}
                    value={job[field] ?? ""}
                    onChange={(e) => patch({ [field]: e.target.value || null })}
                  >
                    <option value="">Choose a pipeline</option>
                    {data.pipelines
                      .filter((p) => p.kind === kind)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </label>
                <div className="hiring-pipeline">
                  {data.stages
                    .filter((s) => s.pipeline_id === job[field])
                    .map((s) => (
                      <div key={s.id}>
                        {s.candidate_label}
                        <small>
                          {s.expected_days === null
                            ? "No expected days"
                            : `${s.expected_days} days`}
                        </small>
                      </div>
                    ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
      <Modal open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title="Job question">
        {edit && (
          <QuestionForm
            key={edit.id ?? "new"}
            initial={edit}
            onSave={(q) => {
              const next = { ...q, id: q.id ?? crypto.randomUUID() };
              setQs(q.id ? questions.map((v) => (v.id === q.id ? next : v)) : [...questions, next]);
              setEdit(null);
            }}
          />
        )}
      </Modal>
      <BankPicker
        open={bankOpen}
        close={() => setBankOpen(false)}
        data={data}
        added={bankIds}
        add={(selected) => {
          setQs([
            ...questions,
            ...selected.map((b) => ({
              id: crypto.randomUUID(),
              source_id: b.id,
              label: b.label,
              type: b.type,
              help_text: b.help_text,
              max_length: b.max_length,
              options: Array.isArray(b.options)
                ? b.options.filter((v): v is string => typeof v === "string")
                : [],
              required: true,
              section:
                sections.find((s) => s.toLowerCase() === b.category.toLowerCase()) ?? "Other",
              sort_order: 0,
              knockout_rule: readKnockout(b.knockout_rule),
            })),
          ]);
          setBankOpen(false);
        }}
      />
      <Modal open={preview} onOpenChange={setPreview} title="Application question preview" wide>
        {[3, 4].map((step) => (
          <section key={step}>
            <h2 className="admin-sub">
              Step {step} · {step === 3 ? "Screening questions" : "Portfolio and CV"}
            </h2>
            {questions
              .filter((q) => (q.section.toLowerCase() === "portfolio" ? 4 : 3) === step)
              .map((q, i) => (
                <ApplicationQuestion
                  key={q.id ?? i}
                  question={{ ...q, id: q.id ?? String(i) }}
                  value={answers[q.id ?? String(i)]}
                  onChange={(v) => setAnswers({ ...answers, [q.id ?? String(i)]: v })}
                />
              ))}
          </section>
        ))}
      </Modal>
      {node}
    </>
  );
}
function BankPicker({
  open,
  close,
  data,
  added,
  add,
}: {
  open: boolean;
  close: () => void;
  data: HiringWorkspace;
  added: Set<string | null | undefined>;
  add: (q: HiringWorkspace["bank"]) => void;
}) {
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState(""),
    [selected, setSelected] = useState<string[]>([]);
  return (
    <Modal open={open} onOpenChange={(o) => !o && close()} title="Add questions from bank" wide>
      <div className="hiring-filters">
        <input
          placeholder="Search bank"
          aria-label="Search bank"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Bank category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {Array.from(new Set(data.bank.map((b) => b.category))).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      {data.bank
        .filter(
          (b) =>
            b.is_active &&
            b.label.toLowerCase().includes(search.toLowerCase()) &&
            (!category || b.category === category),
        )
        .map((b) => (
          <label className="hiring-bank-pick" key={b.id}>
            <input
              type="checkbox"
              disabled={added.has(b.id)}
              checked={added.has(b.id) || selected.includes(b.id)}
              onChange={(e) =>
                setSelected(
                  e.target.checked ? [...selected, b.id] : selected.filter((id) => id !== b.id),
                )
              }
            />
            <span>
              {b.label}
              <small>
                {b.category} · {b.type} {added.has(b.id) && "· Already added"}
              </small>
            </span>
          </label>
        ))}
      <div className="admin-dialog-actions">
        <Action
          primary
          disabled={!selected.length}
          onClick={() => {
            add(data.bank.filter((b) => selected.includes(b.id)));
            setSelected([]);
          }}
        >
          Add selected
        </Action>
      </div>
    </Modal>
  );
}
