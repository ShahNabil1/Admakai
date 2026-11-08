import { useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { useBlocker } from '@tanstack/react-router';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { moveItem } from '@/lib/site-content-rules';

export function Field({ label, hint, error, children, counter }: { label: string; hint?: string; error?: string | undefined; children: ReactNode; counter?: { value: number; max: number } }) {
  return <label className="sc-field">
    <span className="sc-field-label">{label}{counter && <small className={counter.value > counter.max ? 'is-over' : ''}>{counter.value}/{counter.max}</small>}</span>
    {children}
    {hint && <span className="admin-hint">{hint}</span>}
    {error && <span className="work-field-error" role="alert">{error}</span>}
  </label>;
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <span className="work-switch-row"><button type="button" role="switch" aria-checked={checked} aria-label={label} className={`work-switch ${checked ? 'is-on' : ''}`} onClick={() => onChange(!checked)}><span /></button>{label}</span>;
}

/** Add, remove and reorder a list of short text lines. */
export function ListEditor({ label, items, onChange, placeholder, hint, error }: { label: string; items: string[]; onChange: (items: string[]) => void; placeholder?: string; hint?: string; error?: string | undefined }) {
  const [draft, setDraft] = useState('');
  const add = () => { const v = draft.trim(); if (!v) return; onChange([...items, v]); setDraft(''); };
  return <div className="sc-field">
    <span className="sc-field-label">{label}</span>
    <div className="work-list-editor">
      {items.map((item, i) => <div className="work-list-row sc-list-row" key={`${i}-${item}`}>
        <input aria-label={`${label} ${i + 1}`} value={item} onChange={e => onChange(items.map((v, j) => j === i ? e.target.value : v))} />
        <button type="button" className="admin-icon-btn" aria-label="Move up" disabled={i === 0} onClick={() => onChange(moveItem(items, i, i - 1))}><ArrowUp size={14} /></button>
        <button type="button" className="admin-icon-btn" aria-label="Move down" disabled={i === items.length - 1} onClick={() => onChange(moveItem(items, i, i + 1))}><ArrowDown size={14} /></button>
        <button type="button" className="admin-icon-btn is-danger" aria-label="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))}><X size={14} /></button>
      </div>)}
      <div className="work-list-add"><input value={draft} placeholder={placeholder ?? 'Add a line'} aria-label={`Add to ${label}`} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} /><button type="button" className="admin-btn-ghost" onClick={add}><Plus size={14} />Add</button></div>
    </div>
    {hint && <span className="admin-hint">{hint}</span>}
    {error && <span className="work-field-error" role="alert">{error}</span>}
  </div>;
}

/** Blocks in-app navigation and tab closing while there are unsaved changes, with a confirmation dialog. */
export function UnsavedGuard({ dirty }: { dirty: boolean }) {
  const blocker = useBlocker({ shouldBlockFn: () => dirty, enableBeforeUnload: () => dirty, withResolver: true });
  return <AlertDialog open={blocker.status === 'blocked'} onOpenChange={o => { if (!o && blocker.status === 'blocked') blocker.reset(); }}>
    <AlertDialogContent data-lenis-prevent className="admin-dialog">
      <AlertDialogHeader><AlertDialogTitle className="admin-dialog-title">Leave without saving?</AlertDialogTitle><AlertDialogDescription>You have unsaved changes. They will be lost if you leave now.</AlertDialogDescription></AlertDialogHeader>
      <AlertDialogFooter className="admin-dialog-actions">
        <AlertDialogCancel className="admin-btn-ghost" onClick={() => blocker.status === 'blocked' && blocker.reset()}>Keep editing</AlertDialogCancel>
        <button type="button" className="admin-btn is-danger" onClick={() => blocker.status === 'blocked' && blocker.proceed()}>Leave</button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}

/** Drag handlers for a reorderable list plus the dragged index. */
export function useDragOrder<T>(items: T[], onDrop: (next: T[]) => void, enabled = true) {
  const [from, setFrom] = useState<number | null>(null);
  const props = (index: number) => enabled ? {
    draggable: true,
    onDragStart: (e: React.DragEvent) => { setFrom(index); e.dataTransfer.effectAllowed = 'move'; },
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; },
    onDrop: (e: React.DragEvent) => { e.preventDefault(); if (from !== null && from !== index) onDrop(moveItem(items, from, index)); setFrom(null); },
    onDragEnd: () => setFrom(null),
  } : {};
  return { dragging: from, props };
}
