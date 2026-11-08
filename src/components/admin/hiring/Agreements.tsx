import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  saveHiringTemplate,
  moveHiringTemplate,
  markLegalReview,
  type HiringWorkspace,
  type HiringTemplate,
} from "@/lib/hiring-admin.functions";
import { jobTypes } from "@/lib/hiring-admin-rules";
import { fillAgreement } from "@/lib/application-rules";
import { HiringRichText } from "@/components/careers/HiringRichText";
import { Modal, fmtDate, useConfirm } from "../ui";
import { Action, ListEditor, RichEditor } from "./Controls";
export function Agreements({
  data,
  reload,
}: {
  data: HiringWorkspace;
  reload: () => Promise<void>;
}) {
  const [edit, setEdit] = useState<HiringTemplate | null>(null),
    [history, setHistory] = useState<HiringTemplate | null>(null),
    [view, setView] = useState<HiringTemplate | null>(null);
  const save = useServerFn(saveHiringTemplate),
    move = useServerFn(moveHiringTemplate),
    legal = useServerFn(markLegalReview);
  const { confirm, node } = useConfirm();
  const latest = data.templates.filter(
    (t) =>
      !data.templates.some(
        (v) => v.name === t.name && v.job_type === t.job_type && v.version > t.version,
      ),
  );
  const pending = (id: string) =>
    data.reviews.find((r) => r.template_id === id)?.legal_review_pending ?? true;
  return (
    <>
      <header className="admin-head">
        <div>
          <p className="admin-eyebrow">Hiring</p>
          <h1>Agreements</h1>
        </div>
        <Action
          primary
          onClick={() =>
            setEdit({
              id: "",
              name: "",
              job_type: "internship",
              version: 0,
              body: "",
              key_terms: [],
              is_current: true,
              created_at: new Date().toISOString(),
            })
          }
        >
          <Plus size={15} />
          New agreement
        </Action>
      </header>
      <div className="hiring-table-wrap">
        <table className="hiring-table">
          <thead>
            <tr>
              {[
                "Name",
                "Job type",
                "Current version",
                "Last updated",
                "Used by",
                "Legal review",
                "Actions",
              ].map((t) => (
                <th key={t}>{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {latest.map((t) => {
              const ids = data.templates
                .filter((v) => v.name === t.name && v.job_type === t.job_type)
                .map((v) => v.id);
              return (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{t.job_type}</td>
                  <td>v{t.version}</td>
                  <td>{fmtDate(t.created_at)}</td>
                  <td>
                    {
                      data.jobs.filter(
                        (j) => j.agreement_template_id && ids.includes(j.agreement_template_id),
                      ).length
                    }{" "}
                    jobs
                  </td>
                  <td>
                    <label className="hiring-check">
                      <input
                        type="checkbox"
                        checked={pending(t.id)}
                        onChange={(e) =>
                          void legal({ data: { id: t.id, pending: e.target.checked } })
                            .then(reload)
                            .catch(() => toast.error("Could not update legal review"))
                        }
                      />
                      {pending(t.id) ? "Legal review pending" : "Reviewed"}
                    </label>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <Action onClick={() => setEdit(t)}>Edit new version</Action>
                      <Action onClick={() => setHistory(t)}>Version history</Action>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Modal open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title="Agreement editor" wide>
        {edit && (
          <AgreementEditor
            initial={edit}
            pending={pending(edit.id)}
            onSave={async (values) => {
              const old = data.templates
                .filter((t) => t.name === values.name && t.job_type === values.job_type)
                .map((t) => t.id);
              const newId = await save({ data: values });
              setEdit(null);
              await reload();
              toast.success("New agreement version saved");
              const n = data.jobs.filter(
                (j) =>
                  ["draft", "open"].includes(j.status) &&
                  j.agreement_template_id &&
                  old.includes(j.agreement_template_id),
              ).length;
              if (newId && n)
                confirm({
                  title: `Move ${n} draft or open jobs to this new version?`,
                  description:
                    "Previously signed agreements retain their signed version. Candidates with unfinished signatures must sign again.",
                  confirmLabel: "Move jobs",
                  run: async () => {
                    try {
                      await move({ data: { fromIds: old, toId: newId } });
                      await reload();
                      return true;
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Could not move jobs");
                      return false;
                    }
                  },
                });
            }}
          />
        )}
      </Modal>
      <Modal open={!!history} onOpenChange={(o) => !o && setHistory(null)} title="Version history">
        {history &&
          data.templates
            .filter((t) => t.name === history.name && t.job_type === history.job_type)
            .map((t) => (
              <div className="hiring-question-card" key={t.id}>
                <p>
                  Version {t.version} · {fmtDate(t.created_at)}
                </p>
                <Action onClick={() => setView(t)}>View read only</Action>
              </div>
            ))}
      </Modal>
      <Modal
        open={!!view}
        onOpenChange={(o) => !o && setView(null)}
        title={`${view?.name ?? ""} · v${view?.version ?? ""}`}
        wide
      >
        {view && (
          <>
            <HiringRichText
              text={fillAgreement(
                view.body,
                "Sample Applicant",
                "Sample Job",
                "SAMPLE-0001",
                new Date(),
              )}
            />
            {Array.isArray(view.key_terms) &&
              view.key_terms.map((v, i) => <p key={i}>{String(v)}</p>)}
          </>
        )}
      </Modal>
      {node}
    </>
  );
}
function AgreementEditor({
  initial,
  pending,
  onSave,
}: {
  initial: HiringTemplate;
  pending: boolean;
  onSave: (v: {
    name: string;
    job_type: "internship" | "full_time" | "freelance";
    body: string;
    key_terms: string[];
    legal_review_pending: boolean;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(initial.name),
    [type, setType] = useState(initial.job_type),
    [body, setBody] = useState(initial.body),
    [terms, setTerms] = useState(
      Array.isArray(initial.key_terms)
        ? initial.key_terms.filter((v): v is string => typeof v === "string")
        : [],
    ),
    [review, setReview] = useState(pending),
    [busy, setBusy] = useState(false);
  return (
    <div className="hiring-edit-layout">
      <div className="admin-form">
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Job type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {jobTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <RichEditor label="Body" value={body} onChange={setBody} variables />
        <ListEditor label="Key terms" values={terms} onChange={setTerms} />
        <label className="hiring-check">
          <input type="checkbox" checked={review} onChange={(e) => setReview(e.target.checked)} />
          Legal review pending
        </label>
        <Action
          primary
          disabled={busy || !name.trim() || !body.trim()}
          onClick={() => {
            setBusy(true);
            void onSave({
              name,
              job_type: type as "internship" | "full_time" | "freelance",
              body,
              key_terms: terms,
              legal_review_pending: review,
            })
              .catch((e) =>
                toast.error(e instanceof Error ? e.message : "Could not save agreement"),
              )
              .finally(() => setBusy(false));
          }}
        >
          {busy
            ? "Saving…"
            : `Save new version${initial.version ? ` (v${initial.version + 1})` : ""}`}
        </Action>
      </div>
      <div className="hiring-preview">
        <h2 className="admin-sub">Sample preview</h2>
        <HiringRichText
          text={fillAgreement(body, "Sample Applicant", "Sample Job", "SAMPLE-0001", new Date())}
        />
        {terms.map((t, i) => (
          <label className="hiring-check" key={i}>
            <input type="checkbox" />
            {t}
          </label>
        ))}
      </div>
    </div>
  );
}
