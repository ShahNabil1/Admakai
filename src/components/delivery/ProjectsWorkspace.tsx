import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DELIVERABLE_MAX_BYTES, DELIVERABLE_MIME, deliverablePath } from '@/lib/timecode';
import { ReviewPlayer, type Deliverable } from './ReviewPlayer';
import { Empty, Modal, Pill, label } from '@/components/admin/ui';
import './delivery.css';

type Project = { id: string; title: string; stage: string; due_at: string | null; revision_limit: number; client_id: string; clients: { contact_name: string | null; brand_name: string | null } | null };
type Task = { id: string; project_id: string; title: string; status: string; assignee_id: string | null };

const STAGES = ['brief', 'script', 'assets', 'first_cut', 'revision', 'final', 'delivered'];
const TASK_STATUSES = ['todo', 'in_progress', 'in_review', 'done', 'blocked'];

function useLive(tables: string[], reload: () => void) {
  useEffect(() => {
    let ch = supabase.channel(`delivery-${crypto.randomUUID()}`);
    for (const t of tables) ch = ch.on('postgres_changes', { event: '*', schema: 'public', table: t }, () => reload());
    ch.subscribe();
    return () => { void supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload]);
}

/** Staff view: every project the member can see, with tasks, uploads and review. */
export function StaffProjects({ userId }: { userId: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [p, t, d] = await Promise.all([
      supabase.from('projects').select('id, title, stage, due_at, revision_limit, client_id, clients(contact_name, brand_name)').order('created_at', { ascending: false }).limit(200),
      supabase.from('tasks').select('id, project_id, title, status, assignee_id').order('created_at').limit(1000),
      supabase.from('deliverables').select('id, project_id, title, version, status, storage_path, external_url, created_at').order('created_at', { ascending: false }).limit(500),
    ]);
    if (p.error || t.error || d.error) setMsg('Some project data could not be loaded.');
    setProjects((p.data ?? []) as unknown as Project[]);
    setTasks((t.data ?? []) as Task[]);
    setDeliverables((d.data ?? []) as Deliverable[]);
  }, []);
  useEffect(() => { void load(); }, [load]);
  useLive(['projects', 'tasks', 'deliverables'], load);

  const run = async (p: PromiseLike<{ error: { message: string; code?: string } | null }>) => {
    setMsg(null);
    const { error } = await p;
    if (error) setMsg(error.code === '42501' ? 'You do not have permission for that change.' : error.message);
    void load();
  };

  const head = <header className="admin-head"><div><p className="admin-eyebrow">Delivery</p><h1>Projects</h1></div></header>;
  if (!projects.length) return <section>{head}<Empty title="No projects yet" hint="Moving a lead to won opens one automatically." /></section>;
  const current = projects.find((p) => p.id === open) ?? null;

  return (
    <section>
      {head}
      {msg && <p className="admin-alert" role="alert">{msg}</p>}
      <div className="admin-grid">
        {projects.map((p) => {
          const pt = tasks.filter((t) => t.project_id === p.id);
          const done = pt.filter((t) => t.status === 'done').length;
          return (
            <button key={p.id} className="admin-card-item" onClick={() => setOpen(p.id)}>
              <div className="admin-card-top"><strong className="truncate">{p.title}</strong><Pill value={p.stage} /></div>
              <p className="truncate">{p.clients?.brand_name ?? p.clients?.contact_name ?? 'Client'}</p>
              <div className="admin-card-meta"><span>Stage {STAGES.indexOf(p.stage) + 1}/{STAGES.length}</span><span>{done}/{pt.length} tasks</span></div>
              <div className="admin-progress"><i style={{ width: `${((STAGES.indexOf(p.stage) + 1) / STAGES.length) * 100}%` }} /></div>
            </button>
          );
        })}
      </div>
      <Modal open={!!current} onOpenChange={(o) => !o && setOpen(null)} title={current?.title ?? ''} description={current ? `${current.clients?.brand_name ?? current.clients?.contact_name ?? 'Client'} · ${current.revision_limit} revisions included` : undefined} wide>
        {current && (<>
          <p className="admin-label">Stage</p>
          <div className="admin-stepper">
            {STAGES.map((s, i) => <button key={s} className={`${current.stage === s ? 'is-active' : ''} ${STAGES.indexOf(current.stage) > i ? 'is-done' : ''}`} onClick={() => s !== current.stage && run(supabase.from('projects').update({ stage: s }).eq('id', current.id))}>{label(s)}</button>)}
          </div>
          <ProjectDetail project={current} userId={userId} tasks={tasks.filter((t) => t.project_id === current.id)} deliverables={deliverables.filter((d) => d.project_id === current.id)} run={run} reload={load} />
        </>)}
      </Modal>
    </section>
  );
}

function ProjectDetail({ project, userId, tasks, deliverables, run, reload }: { project: Project; userId: string; tasks: Task[]; deliverables: Deliverable[]; run: (p: PromiseLike<{ error: { message: string; code?: string } | null }>) => Promise<void>; reload: () => void }) {
  const [taskTitle, setTaskTitle] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(deliverables[0]?.id ?? null);
  const current = deliverables.find((d) => d.id === active);

  const submit = async () => {
    setErr(null);
    const name = title.trim();
    if (!name || !file) { setErr('Add a title and choose a file.'); return; }
    if (!DELIVERABLE_MIME.includes(file.type)) { setErr('Use MP4, MOV, WebM, JPG, PNG, WebP or PDF.'); return; }
    if (file.size > DELIVERABLE_MAX_BYTES) { setErr('Files must be 2 GB or smaller.'); return; }
    setUploading(true);
    const path = deliverablePath(project.id, file.name);
    const up = await supabase.storage.from('deliverables').upload(path, file, { contentType: file.type, upsert: false });
    if (up.error) { setUploading(false); setErr('Upload failed. Please try again.'); return; }
    const previous = deliverables.filter((d) => d.title === name);
    const version = previous.reduce((n, d) => Math.max(n, d.version), 0) + 1;
    const { error } = await supabase.from('deliverables').insert({ project_id: project.id, title: name, version, status: version > 1 ? 'resubmitted' : 'submitted', storage_path: path, submitted_by: userId });
    setUploading(false);
    if (error) { setErr('The file uploaded but could not be recorded.'); return; }
    setTitle(''); setFile(null); reload();
  };

  return (
    <>
      <h2>Tasks</h2>
      <div className="delivery-row">
        <input type="text" aria-label="New task" placeholder="New task" value={taskTitle} maxLength={200} onChange={(e) => setTaskTitle(e.target.value)} />
        <button className="admin-link" disabled={!taskTitle.trim()} onClick={async () => { await run(supabase.from('tasks').insert({ project_id: project.id, title: taskTitle.trim() })); setTaskTitle(''); }}>Add task</button>
      </div>
      <div className="delivery-tasks">
        {TASK_STATUSES.map((s) => (
          <section key={s}><h4>{s.replace('_', ' ')}</h4><ul>
            {tasks.filter((t) => t.status === s).map((t) => (
              <li key={t.id}>{t.title}
                <select aria-label="Task status" value={t.status} onChange={(e) => run(supabase.from('tasks').update({ status: e.target.value }).eq('id', t.id))}>
                  {TASK_STATUSES.map((x) => <option key={x} value={x}>{x.replace('_', ' ')}</option>)}
                </select>
                {!t.assignee_id && <button className="admin-link" style={{ marginLeft: 0 }} onClick={() => run(supabase.from('tasks').update({ assignee_id: userId }).eq('id', t.id))}>Take</button>}
              </li>
            ))}
          </ul></section>
        ))}
      </div>

      <h2>Deliverables</h2>
      <div className="delivery-row">
        <input type="text" aria-label="Deliverable title" placeholder="Title, e.g. Reel 01" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
        <input type="file" aria-label="Deliverable file" accept={DELIVERABLE_MIME.join(',')} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button className="admin-link" disabled={uploading} onClick={submit}>{uploading ? 'Uploading…' : 'Send for review'}</button>
      </div>
      {err && <p className="admin-alert" role="alert">{err}</p>}
      <DeliverableList items={deliverables} active={active} setActive={setActive} />
      {current && <ReviewPlayer key={current.id} deliverable={current} mode="staff" userId={userId} onChanged={reload} />}
    </>
  );
}

function DeliverableList({ items, active, setActive }: { items: Deliverable[]; active: string | null; setActive: (id: string) => void }) {
  if (!items.length) return <p className="admin-empty">Nothing delivered yet.</p>;
  return (
    <div className="delivery-list">
      {items.map((d) => (
        <button key={d.id} type="button" className={active === d.id ? 'is-active' : ''} onClick={() => setActive(d.id)}>
          <span>{d.title} · v{d.version}</span><span className={`review-status is-${d.status}`}>{d.status.replace('_', ' ')}</span>
        </button>
      ))}
    </div>
  );
}
