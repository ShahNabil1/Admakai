import { useState } from "react";
import { toast } from "sonner";
import {
  questionSchema,
  questionTypes,
  sections,
  type HiringQuestion,
} from "@/lib/hiring-admin-rules";
import { Action, ListEditor } from "./Controls";
export function readKnockout(value: unknown): HiringQuestion["knockout_rule"] {
  if (!value || typeof value !== "object") return null;
  const r = value as Record<string, unknown>;
  for (const operator of ["equals", "contains", "less_than"] as const) {
    const v = r[operator];
    if (typeof v === "string" || typeof v === "number") return { operator, value: v };
  }
  if (
    ["equals", "contains", "less_than"].includes(String(r["operator"])) &&
    (typeof r["value"] === "string" || typeof r["value"] === "number")
  )
    return r as HiringQuestion["knockout_rule"];
  return null;
}
export const emptyQuestion = (): HiringQuestion => ({
  label: "",
  help_text: "",
  type: "short_text",
  options: [],
  max_length: 3000,
  required: true,
  section: "Other",
  category: "Other",
  sort_order: 0,
  knockout_rule: null,
});
export function QuestionForm({
  initial,
  onSave,
}: {
  initial: HiringQuestion;
  onSave: (q: HiringQuestion) => Promise<void> | void;
}) {
  const [q, setQ] = useState(initial),
    [busy, setBusy] = useState(false);
  const patch = (v: Partial<HiringQuestion>) => setQ({ ...q, ...v });
  const choice = ["yes_no", "single_choice", "multi_choice", "rating"].includes(q.type);
  return (
    <form
      className="admin-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const parsed = questionSchema.safeParse(q);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message);
          return;
        }
        setBusy(true);
        try {
          await onSave(parsed.data);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Question could not save.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Label
        <input value={q.label} onChange={(e) => patch({ label: e.target.value })} />
      </label>
      <label>
        Help text
        <textarea
          value={q.help_text ?? ""}
          onChange={(e) => patch({ help_text: e.target.value })}
        />
      </label>
      <div className="admin-form-row">
        <label>
          Type
          <select
            value={q.type}
            onChange={(e) => patch({ type: e.target.value, knockout_rule: null })}
          >
            {questionTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          Section / category
          <select
            value={q.section}
            onChange={(e) => patch({ section: e.target.value, category: e.target.value })}
          >
            {sections.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      {["single_choice", "multi_choice"].includes(q.type) && (
        <ListEditor
          label="Options"
          values={q.options ?? []}
          onChange={(options) => patch({ options })}
        />
      )}{" "}
      {["short_text", "long_text"].includes(q.type) && (
        <label>
          Maximum length
          <input
            type="number"
            min={1}
            max={3000}
            value={q.max_length ?? 3000}
            onChange={(e) => patch({ max_length: Number(e.target.value) })}
          />
        </label>
      )}
      <label className="hiring-check">
        <input
          type="checkbox"
          checked={q.required}
          onChange={(e) => patch({ required: e.target.checked })}
        />
        Required
      </label>
      {choice && (
        <>
          <label className="hiring-check">
            <input
              type="checkbox"
              checked={!!q.knockout_rule}
              onChange={(e) =>
                patch({
                  knockout_rule: e.target.checked
                    ? {
                        operator:
                          q.type === "rating"
                            ? "less_than"
                            : q.type === "multi_choice"
                              ? "contains"
                              : "equals",
                        value:
                          q.type === "rating"
                            ? 3
                            : q.type === "yes_no"
                              ? "no"
                              : (q.options?.[0] ?? ""),
                      }
                    : null,
                })
              }
            />
            Knockout flag
          </label>
          {q.knockout_rule && (
            <label>
              {q.type === "rating"
                ? "Flag the applicant if the rating is below"
                : "Flag the applicant if the answer is"}
              {q.type === "rating" ? (
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={q.knockout_rule.value}
                  onChange={(e) =>
                    patch({
                      knockout_rule: { operator: "less_than", value: Number(e.target.value) },
                    })
                  }
                />
              ) : (
                <select
                  value={q.knockout_rule.value}
                  onChange={(e) =>
                    patch({
                      knockout_rule: {
                        operator: q.type === "multi_choice" ? "contains" : "equals",
                        value: e.target.value,
                      },
                    })
                  }
                >
                  {(q.type === "yes_no" ? ["yes", "no"] : (q.options ?? [])).map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              )}
            </label>
          )}
        </>
      )}
      <Action
        primary
        disabled={busy}
        onClick={() => {
          const parsed = questionSchema.safeParse(q);
          if (!parsed.success) {
            toast.error(parsed.error.issues[0]?.message);
            return;
          }
          setBusy(true);
          Promise.resolve(onSave(parsed.data))
            .catch((e) => toast.error(e instanceof Error ? e.message : "Question could not save."))
            .finally(() => setBusy(false));
        }}
      >
        {busy ? "Saving…" : "Save question"}
      </Action>
    </form>
  );
}
