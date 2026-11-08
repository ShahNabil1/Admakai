import { useRef, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUp, Bold, Heading2, Link, List, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadHiringImage } from "@/lib/hiring-admin.functions";
import { useHiringMedia } from "@/hooks/use-hiring-media";
export function Action({
  children,
  onClick,
  disabled = false,
  primary = false,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  title?: string;
}) {
  return (
    <Button
      type="button"
      variant={primary ? "default" : "ghost"}
      className={primary ? "admin-btn" : "admin-btn-ghost"}
      disabled={disabled}
      title={title}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
export function ListEditor({
  label,
  values,
  onChange,
  disabled = false,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
}) {
  const [drag, setDrag] = useState<number | null>(null);
  const move = (i: number, j: number) => {
    if (j < 0 || j >= values.length) return;
    const copy = [...values];
    const [v] = copy.splice(i, 1);
    if (v !== undefined) copy.splice(j, 0, v);
    onChange(copy);
  };
  return (
    <fieldset className="hiring-list" disabled={disabled}>
      <legend>{label}</legend>
      {values.map((v, i) => (
        <div
          key={i}
          draggable={!disabled}
          onDragStart={() => setDrag(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (drag !== null) move(drag, i);
            setDrag(null);
          }}
        >
          <input
            aria-label={`${label} ${i + 1}`}
            value={v}
            onChange={(e) => onChange(values.map((s, n) => (n === i ? e.target.value : s)))}
          />
          <Action title="Move up" disabled={i === 0 || disabled} onClick={() => move(i, i - 1)}>
            <ArrowUp size={14} />
          </Action>
          <Action
            title="Move down"
            disabled={i === values.length - 1 || disabled}
            onClick={() => move(i, i + 1)}
          >
            <ArrowDown size={14} />
          </Action>
          <Action
            title="Remove"
            disabled={disabled}
            onClick={() => onChange(values.filter((_, n) => n !== i))}
          >
            <Trash2 size={14} />
          </Action>
        </div>
      ))}
      {!disabled && (
        <Action onClick={() => onChange([...values, ""])}>
          <Plus size={14} />
          Add item
        </Action>
      )}
    </fieldset>
  );
}
export function RichEditor({
  label,
  value,
  onChange,
  disabled = false,
  variables = false,
  variableNames = ["candidate_name", "job_title", "application_id", "date", "start_date"],
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  variables?: boolean;
  variableNames?: string[];
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const insert = (before: string, after = "") => {
    const node = ref.current;
    if (!node) return;
    const start = node.selectionStart,
      end = node.selectionEnd;
    onChange(value.slice(0, start) + before + value.slice(start, end) + after + value.slice(end));
    requestAnimationFrame(() => {
      node.focus();
      node.setSelectionRange(start + before.length, end + before.length);
    });
  };
  return (
    <label className="hiring-editor">
      {label}
      <span className="hiring-toolbar">
        {[
          { icon: Heading2, title: "Heading", before: "\n## " },
          { icon: Bold, title: "Bold", before: "**", after: "**" },
          { icon: List, title: "List", before: "\n- " },
          { icon: Link, title: "Link", before: "[", after: "](https://)" },
        ].map((c) => (
          <Action
            key={c.title}
            title={c.title}
            disabled={disabled}
            onClick={() => insert(c.before, c.after)}
          >
            <c.icon size={15} />
          </Action>
        ))}
      </span>
      {variables && (
        <span className="hiring-toolbar">
          {variableNames.map((v) => (
            <Action
              key={v}
              disabled={disabled}
              onClick={() => insert(`{{${v}}}`)}
            >{`{{${v}}}`}</Action>
          ))}
        </span>
      )}
      <textarea
        ref={ref}
        rows={9}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
export function ImageUpload({
  label,
  bucket,
  value,
  onChange,
}: {
  label: string;
  bucket: "hiring-media" | "hiring-assets";
  value: string | null;
  onChange: (path: string, url: string) => void;
}) {
  const upload = useServerFn(uploadHiringImage);
  const mediaUrl = useHiringMedia(bucket === "hiring-media" ? value : null);
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="hiring-upload">
      <span>{label}</span>
      {(bucket === "hiring-media" ? mediaUrl : value) && <img src={(bucket === "hiring-media" ? mediaUrl : value) ?? undefined} alt={label} />}
      <input
        ref={ref}
        type="file"
        hidden
        accept="image/png,image/jpeg,image/webp"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          try {
            const form = new FormData();
            form.set("bucket", bucket);
            form.set("file", file);
            const r = await upload({ data: form });
            onChange(r.path, r.url);
          } catch {
            toast.error("Image could not upload.");
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
      <Action disabled={busy} onClick={() => ref.current?.click()}>
        <Upload size={15} />
        {busy ? "Uploading…" : "Upload image"}
      </Action>
    </div>
  );
}

/** Previous/next paging with a total, 50 rows per page. */
export function Pager({ page, total, size = 50, onPage }: { page: number; total: number; size?: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size));
  if (total <= size) return <p className="hiring-pager-total">{total} total</p>;
  return (
    <nav className="hiring-pager admin-actions" aria-label="Pages">
      <Action disabled={page <= 0} onClick={() => onPage(page - 1)}>Previous</Action>
      <span>Page {page + 1} of {pages} · {total} total</span>
      <Action disabled={page >= pages - 1} onClick={() => onPage(page + 1)}>Next</Action>
    </nav>
  );
}

type Delivery = { id: string; kind: string; trigger_key: string; status: string; attempts: number; last_error: string | null; created_at: string };
const kindLabel = (d: Delivery) => d.kind === 'agreement_pdf' ? 'Agreement PDF' : d.kind === 'offer_letter' ? 'Offer letter' : d.kind === 'promotion_letter' ? 'Promotion letter' : `Email · ${d.trigger_key.replace(/_/g, ' ')}`;
const statusLabel = (s: string) => s === 'sent' ? 'Sent' : s === 'failed' ? 'Failed' : 'Pending';
/** Sent / Pending / Failed with Retry, read from the delivery outbox. */
export function DeliveryList({ items, canRetry, onRetry }: { items: Delivery[]; canRetry: boolean; onRetry: (id: string) => Promise<unknown> }) {
  const [busy, setBusy] = useState<string | null>(null);
  if (!items.length) return null;
  return (
    <ul className="hiring-deliveries">
      {items.map((d) => (
        <li key={d.id} data-status={d.status}>
          <span>{kindLabel(d)}</span>
          <strong className={`admin-pill hiring-delivery-${statusLabel(d.status).toLowerCase()}`}>{statusLabel(d.status)}</strong>
          {d.status === 'failed' && d.last_error && <small title={d.last_error}>{d.last_error.slice(0, 120)}</small>}
          {d.status === 'failed' && canRetry && (
            <Action disabled={busy === d.id} onClick={() => { setBusy(d.id); void onRetry(d.id).then((r) => { const s = (r as { status?: string } | undefined)?.status; if (s === 'sent') toast.success('Delivered'); else if (s === 'failed') toast.error('Still failing; see the error shown'); else toast.message('Queued for another try'); }).catch((e: unknown) => toast.error(e instanceof Error ? e.message : 'Retry failed')).finally(() => setBusy(null)); }}>Retry</Action>
          )}
        </li>
      ))}
    </ul>
  );
}
