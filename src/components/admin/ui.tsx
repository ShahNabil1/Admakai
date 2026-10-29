import { useState, type ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { describeActivity, type ActivityRow } from '@/lib/activity';

export const fmtDate = (iso: string, withTime = true) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', dateStyle: 'medium', ...(withTime ? { timeStyle: 'short' } : {}) }).format(new Date(iso));
export const label = (s: string) => s.replace(/_/g, ' ');

export function Pill({ value }: { value: string }) {
  return <span className={`admin-pill is-${value}`}>{label(value)}</span>;
}

export function Modal({ open, onOpenChange, title, description, wide, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string | undefined; wide?: boolean; children: ReactNode }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-lenis-prevent className={`admin-dialog ${wide ? 'is-wide' : ''}`}>
        <DialogHeader>
          <DialogTitle className="admin-dialog-title">{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : <DialogDescription className="sr-only">{title}</DialogDescription>}
        </DialogHeader>
        <div className="admin-dialog-body">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

export type ConfirmRequest = { title: string; description: string; confirmLabel: string; danger?: boolean; run: () => Promise<boolean | void> };

/** One shared confirmation dialog; callers pass a request and the dialog awaits the action. */
export function useConfirm() {
  const [req, setReq] = useState<ConfirmRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const node = (
    <AlertDialog open={!!req} onOpenChange={(o) => { if (!o && !busy) setReq(null); }}>
      <AlertDialogContent data-lenis-prevent className="admin-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle className="admin-dialog-title">{req?.title}</AlertDialogTitle>
          <AlertDialogDescription>{req?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="admin-dialog-actions">
          <AlertDialogCancel className="admin-btn-ghost" disabled={busy}>Cancel</AlertDialogCancel>
          <button
            type="button"
            className={req?.danger ? 'admin-btn is-danger' : 'admin-btn'}
            disabled={busy}
            onClick={async () => {
              if (!req) return;
              setBusy(true);
              const ok = await req.run();
              setBusy(false);
              if (ok !== false) setReq(null);
            }}
          >
            {busy ? 'Working…' : req?.confirmLabel}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  return { confirm: setReq, node };
}

export function Timeline({ rows, names }: { rows: ActivityRow[]; names: Record<string, string> }) {
  if (!rows.length) return <p className="admin-empty">No recorded activity yet.</p>;
  return (
    <ol className="admin-timeline">
      {rows.map((a, i) => (
        <li key={a.id ?? i}>
          <span className="admin-timeline-dot" aria-hidden />
          <div className="min-w-0">
            <p>{describeActivity(a)}</p>
            <small>{a.actor_id ? names[a.actor_id] ?? 'Team member' : 'System'} · {a.created_at ? fmtDate(a.created_at) : ''}</small>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return <div className="admin-empty-card"><strong>{title}</strong>{hint && <span>{hint}</span>}</div>;
}
