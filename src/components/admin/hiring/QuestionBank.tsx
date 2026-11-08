import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  archiveBankQuestion,
  saveBankQuestion,
  updateDraftQuestions,
  type HiringWorkspace,
} from "@/lib/hiring-admin.functions";
import { questionTypes, type HiringQuestion } from "@/lib/hiring-admin-rules";
import { Modal, useConfirm } from "../ui";
import { Action } from "./Controls";
import { emptyQuestion, QuestionForm, readKnockout } from "./QuestionForm";
export function QuestionBank({
  data,
  admin,
  reload,
}: {
  data: HiringWorkspace;
  admin: boolean;
  reload: () => Promise<void>;
}) {
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState(""),
    [type, setType] = useState(""),
    [edit, setEdit] = useState<HiringQuestion | null>(null);
  const save = useServerFn(saveBankQuestion),
    archive = useServerFn(archiveBankQuestion),
    propagate = useServerFn(updateDraftQuestions);
  const { confirm, node } = useConfirm();
  const uses = (id: string) =>
    data.questions.filter(
      (q) =>
        (data.sources.find((s) => s.job_question_id === q.id)?.bank_question_id ??
          q.question_id) === id,
    );
  return (
    <>
      <header className="admin-head">
        <div>
          <p className="admin-eyebrow">Hiring</p>
          <h1>Question bank</h1>
        </div>
        {admin && (
          <Action primary onClick={() => setEdit(emptyQuestion())}>
            <Plus size={15} />
            New question
          </Action>
        )}
      </header>
      <div className="hiring-filters">
        <input
          type="search"
          aria-label="Search questions"
          placeholder="Search questions"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={category}
          aria-label="Category"
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {Array.from(new Set(data.bank.map((q) => q.category))).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select value={type} aria-label="Question type" onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {questionTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="hiring-table-wrap">
        <table className="hiring-table">
          <thead>
            <tr>
              {["Label", "Category", "Type", "Knockout", "Used in", "Status", "Actions"].map(
                (t) => (
                  <th key={t}>{t}</th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {data.bank
              .filter(
                (q) =>
                  q.label.toLowerCase().includes(search.toLowerCase()) &&
                  (!category || q.category === category) &&
                  (!type || q.type === type),
              )
              .map((q) => (
                <tr key={q.id}>
                  <td>{q.label}</td>
                  <td>{q.category}</td>
                  <td>{q.type}</td>
                  <td>{q.knockout_rule ? "Yes" : "No"}</td>
                  <td>{new Set(uses(q.id).map((v) => v.job_id)).size} jobs</td>
                  <td>{q.is_active ? "Active" : "Archived"}</td>
                  <td>
                    {admin ? (
                      <div className="admin-actions">
                        <Action
                          onClick={() =>
                            setEdit({
                              id: q.id,
                              label: q.label,
                              help_text: q.help_text,
                              type: q.type,
                              options: Array.isArray(q.options)
                                ? q.options.filter((v): v is string => typeof v === "string")
                                : [],
                              max_length: q.max_length,
                              required: true,
                              section: q.category,
                              category: q.category,
                              sort_order: 0,
                              knockout_rule: readKnockout(q.knockout_rule),
                            })
                          }
                        >
                          Edit
                        </Action>
                        <Action
                          onClick={() =>
                            confirm({
                              title: q.is_active ? "Archive question?" : "Restore question?",
                              description: "Existing job copies are kept unchanged.",
                              confirmLabel: q.is_active ? "Archive" : "Restore",
                              run: async () => {
                                try {
                                  await archive({ data: { id: q.id, active: !q.is_active } });
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
                          {q.is_active ? "Archive" : "Restore"}
                        </Action>
                      </div>
                    ) : (
                      <span className="admin-hint">Read only</span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <Modal open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title="Bank question" wide>
        {edit && (
          <QuestionForm
            key={edit.id ?? "new"}
            initial={edit}
            onSave={async (q) => {
              const result = await save({ data: q });
              const drafts = new Set(
                q.id
                  ? uses(q.id)
                      .filter((u) => data.jobs.find((j) => j.id === u.job_id)?.status === "draft")
                      .map((u) => u.job_id)
                  : [],
              );
              setEdit(null);
              await reload();
              toast.success("Bank question saved");
              if (result && drafts.size)
                confirm({
                  title: `Also update it in ${drafts.size} draft jobs?`,
                  description:
                    "Only draft jobs will receive the updated question. Open and closed jobs stay unchanged.",
                  confirmLabel: "Update draft jobs",
                  run: async () => {
                    try {
                      await propagate({ data: { id: result } });
                      await reload();
                      toast.success("Draft job questions updated");
                      return true;
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Could not update");
                      return false;
                    }
                  },
                });
            }}
          />
        )}
      </Modal>
      {node}
    </>
  );
}
