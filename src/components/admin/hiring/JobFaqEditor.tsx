import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { JobFaq } from '@/lib/job-page-rules';

/** Questions and answers shown in the FAQ section of the job page. */
export function JobFaqEditor({ value, onChange, disabled }: { value: JobFaq[]; onChange: (next: JobFaq[]) => void; disabled: boolean }) {
  const move = (from: number, to: number) => { const next = [...value]; const [item] = next.splice(from, 1); if (item) next.splice(to, 0, item); onChange(next); };
  const set = (i: number, patch: Partial<JobFaq>) => onChange(value.map((f, j) => j === i ? { ...f, ...patch } : f));
  return <fieldset className="hiring-faq-editor" disabled={disabled}>
    <legend>Job page FAQ</legend>
    <p className="admin-hint">Shown as the FAQ on this job's page. Leave empty to hide the section.</p>
    {value.map((f, i) => <div key={i} className="hiring-faq-row">
      <label>Question<input value={f.question} maxLength={300} onChange={e => set(i, { question: e.target.value })} /></label>
      <label>Answer<textarea rows={2} value={f.answer} maxLength={2000} onChange={e => set(i, { answer: e.target.value })} /></label>
      <div className="hiring-faq-actions">
        <button type="button" className="admin-icon-btn" aria-label="Move question up" disabled={i === 0} onClick={() => move(i, i - 1)}><ArrowUp size={14} /></button>
        <button type="button" className="admin-icon-btn" aria-label="Move question down" disabled={i === value.length - 1} onClick={() => move(i, i + 1)}><ArrowDown size={14} /></button>
        <button type="button" className="admin-icon-btn" aria-label="Remove question" onClick={() => onChange(value.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
      </div>
    </div>)}
    {value.length < 30 && <button type="button" className="admin-btn-ghost" onClick={() => onChange([...value, { question: '', answer: '' }])}><Plus size={14} />Add question</button>}
  </fieldset>;
}
