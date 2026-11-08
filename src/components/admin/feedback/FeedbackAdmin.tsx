import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { compactCount, publicTotal, reactionMeta, type WorkComment } from '@/lib/work-feedback';
import './feedback-admin.css';

type Work = { id: string; title: string; slug: string; base_views: number; base_reactions: number };
type View = { work_id: string; viewer_id: string | null; created_at: string };
type Reaction = { work_id: string; kind: string };
type Status = WorkComment['status'];

/** Staff-only portfolio feedback: views, reactions, comment approvals and starting numbers. */
export function FeedbackAdmin() {
  const [days, setDays] = useState<7 | 30>(30);
  const [works, setWorks] = useState<Work[]>([]);
  const [views, setViews] = useState<View[]>([]);
  const [allViewCounts, setAllViewCounts] = useState<Record<string, number>>({});
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [comments, setComments] = useState<WorkComment[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<Status>('pending');
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const since = new Date(Date.now() - days * 86400_000).toISOString();
    const [w, v, r, c] = await Promise.all([
      supabase.from('works').select('id, title, slug, base_views, base_reactions').order('sort_order'),
      supabase.from('work_views').select('work_id, viewer_id, created_at').gte('created_at', since).order('created_at', { ascending: false }).limit(5000),
      supabase.from('work_reactions').select('work_id, kind').limit(5000),
      supabase.from('work_comments').select('id, work_id, user_id, author_label, body, status, team_kind, pinned, created_at').order('created_at', { ascending: false }).limit(1000),
    ]);
    if (w.error || v.error || r.error || c.error) { console.error(w.error ?? v.error ?? r.error ?? c.error); toast.error('Feedback could not load.'); }
    setWorks((w.data ?? []) as Work[]); setViews((v.data ?? []) as View[]); setReactions((r.data ?? []) as Reaction[]); setComments((c.data ?? []) as WorkComment[]);
    const ids = (w.data ?? []).map((x) => x.id);
    const totals = await Promise.all(ids.map(async (id) => [id, (await supabase.from('work_views').select('id', { count: 'exact', head: true }).eq('work_id', id)).count ?? 0] as const));
    setAllViewCounts(Object.fromEntries(totals));
    const viewerIds = [...new Set((v.data ?? []).map((x) => x.viewer_id).filter(Boolean) as string[])].slice(0, 300);
    if (viewerIds.length) {
      const { data } = await supabase.from('profiles').select('id, full_name').in('id', viewerIds);
      setNames(Object.fromEntries((data ?? []).map((p: { id: string; full_name: string | null }) => [p.id, p.full_name || 'Signed-in viewer'])));
    }
    setLoading(false);
  };
  useEffect(() => { void load(); }, [days]); // eslint-disable-line react-hooks/exhaustive-deps

  const byWork = useMemo(() => {
    const m: Record<string, { views: number; signed: number; reactions: Record<string, number>; comments: number }> = {};
    for (const w of works) m[w.id] = { views: 0, signed: 0, reactions: {}, comments: 0 };
    for (const v of views) { const x = m[v.work_id]; if (x) { x.views++; if (v.viewer_id) x.signed++; } }
    for (const r of reactions) { const x = m[r.work_id]; if (x) x.reactions[r.kind] = (x.reactions[r.kind] ?? 0) + 1; }
    for (const c of comments) { const x = m[c.work_id]; if (x && c.status === 'approved') x.comments++; }
    return m;
  }, [works, views, reactions, comments]);
  const top = [...works].sort((a, b) => (byWork[b.id]?.views ?? 0) - (byWork[a.id]?.views ?? 0)).slice(0, 8);
  const pending = comments.filter((c) => c.status === 'pending').length;
  const title = (id: string) => works.find((w) => w.id === id)?.title ?? 'Video';

  const setStatus = async (c: WorkComment, status: Status) => {
    const { error } = await supabase.from('work_comments').update({ status }).eq('id', c.id);
    if (error) { console.error(error); toast.error('Could not update the comment.'); return; }
    setComments((list) => list.map((x) => (x.id === c.id ? { ...x, status } : x)));
  };
  const remove = async (c: WorkComment) => {
    if (!window.confirm('Delete this comment for good?')) return;
    const { error } = await supabase.from('work_comments').delete().eq('id', c.id);
    if (error) { console.error(error); toast.error('Could not delete the comment.'); return; }
    setComments((list) => list.filter((x) => x.id !== c.id));
  };

  const sel = works.find((w) => w.id === selected) ?? null;
  return (
    <section className="fb-admin">
      <header className="admin-head"><div><p className="admin-eyebrow">Portfolio</p><h1>Portfolio feedback</h1></div>
        <div className="fb-range">{([7, 30] as const).map((d) => <button key={d} className={days === d ? 'is-on' : ''} onClick={() => setDays(d)}>Last {d} days</button>)}</div>
      </header>

      <div className="fb-stats">
        <div><small>Real views ({days}d)</small><strong>{compactCount(views.length)}</strong></div>
        <div><small>Signed-in viewers</small><strong>{new Set(views.map((v) => v.viewer_id).filter(Boolean)).size}</strong></div>
        <div><small>Real reactions</small><strong>{compactCount(reactions.length)}</strong></div>
        <div><small>Waiting for approval</small><strong>{pending}</strong></div>
      </div>

      <div className="fb-grid">
        <div className="admin-panel">
          <h2>Top videos</h2>
          {loading ? <div className="admin-skeleton" /> : (
            <table className="fb-table"><thead><tr><th>Video</th><th>Real views</th><th>Shown publicly</th><th>Reactions</th><th /></tr></thead>
              <tbody>{top.map((w) => { const s = byWork[w.id]; return (
                <tr key={w.id}><td>{w.title}</td><td>{s?.views ?? 0}</td><td>{compactCount(publicTotal(w.base_views, allViewCounts[w.id] ?? 0))}</td>
                  <td>{Object.entries(s?.reactions ?? {}).map(([k, n]) => <span key={k} className="fb-chip">{reactionMeta(k).emoji} {n}</span>)}</td>
                  <td><button className="admin-btn-ghost" onClick={() => setSelected(w.id)}>Details</button></td></tr>); })}</tbody></table>
          )}
          <label className="fb-pick">All videos
            <select value={selected ?? ''} onChange={(e) => setSelected(e.target.value || null)}><option value="">Choose a video…</option>{works.map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}</select>
          </label>
        </div>

        {sel && <VideoDetail key={sel.id} work={sel} views={views.filter((v) => v.work_id === sel.id)} names={names} realTotal={allViewCounts[sel.id] ?? 0}
          reactions={byWork[sel.id]?.reactions ?? {}} onSaved={(w) => setWorks((list) => list.map((x) => (x.id === w.id ? w : x)))} onComment={(c) => setComments((l) => [c, ...l])} />}
      </div>

      <div className="admin-panel">
        <div className="fb-tabs">{(['pending', 'approved', 'hidden'] as const).map((s) => <button key={s} className={tab === s ? 'is-on' : ''} onClick={() => setTab(s)}>{s.charAt(0).toUpperCase() + s.slice(1)} ({comments.filter((c) => c.status === s).length})</button>)}</div>
        <ul className="fb-comments">
          {comments.filter((c) => c.status === tab).map((c) => (
            <li key={c.id}>
              <div><p className="fb-meta"><strong>{c.team_kind === 'team' ? 'Admakai team' : c.author_label}</strong>{c.team_kind === 'client' && <em>Client feedback</em>} on <b>{title(c.work_id)}</b> · {new Date(c.created_at).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })}</p><p>{c.body}</p></div>
              <div className="fb-actions">
                {c.status !== 'approved' && <button className="admin-btn" onClick={() => void setStatus(c, 'approved')}>Approve</button>}
                {c.status !== 'hidden' && <button className="admin-btn-ghost" onClick={() => void setStatus(c, 'hidden')}>Hide</button>}
                <button className="admin-btn-ghost" onClick={() => void remove(c)}>Delete</button>
              </div>
            </li>
          ))}
          {!comments.some((c) => c.status === tab) && <li className="fb-empty">Nothing here.</li>}
        </ul>
      </div>
    </section>
  );
}

function VideoDetail({ work, views, names, realTotal, reactions, onSaved, onComment }: {
  work: Work; views: View[]; names: Record<string, string>; realTotal: number; reactions: Record<string, number>;
  onSaved: (w: Work) => void; onComment: (c: WorkComment) => void;
}) {
  const [baseViews, setBaseViews] = useState(String(work.base_views));
  const [baseReactions, setBaseReactions] = useState(String(work.base_reactions));
  const [kind, setKind] = useState<'team' | 'client'>('team');
  const [label, setLabel] = useState('');
  const [body, setBody] = useState('');
  const save = async () => {
    const bv = Math.max(0, Math.min(100_000_000, Math.floor(Number(baseViews) || 0)));
    const br = Math.max(0, Math.min(100_000_000, Math.floor(Number(baseReactions) || 0)));
    const { error } = await supabase.from('works').update({ base_views: bv, base_reactions: br }).eq('id', work.id);
    if (error) { console.error(error); toast.error('Could not save the starting numbers.'); return; }
    onSaved({ ...work, base_views: bv, base_reactions: br }); toast.success('Saved');
  };
  const add = async () => {
    const name = kind === 'team' ? 'Admakai team' : label.trim();
    if (!name || !body.trim()) { toast.error(kind === 'client' ? 'Add the client name and their feedback.' : 'Write the comment first.'); return; }
    const { data, error } = await supabase.from('work_comments').insert({ work_id: work.id, author_label: name.slice(0, 80), body: body.trim().slice(0, 1000), status: 'approved', team_kind: kind, pinned: true })
      .select('id, work_id, user_id, author_label, body, status, team_kind, pinned, created_at').single();
    if (error) { console.error(error); toast.error('Could not add the comment.'); return; }
    onComment(data as WorkComment); setBody(''); setLabel(''); toast.success('Pinned on the video');
  };
  const perDay = useMemo(() => { const m: Record<string, number> = {}; for (const v of views) { const d = v.created_at.slice(0, 10); m[d] = (m[d] ?? 0) + 1; } return Object.entries(m).sort(); }, [views]);
  const max = Math.max(1, ...perDay.map(([, n]) => n));
  const signed = [...new Set(views.map((v) => v.viewer_id).filter(Boolean) as string[])];
  return (
    <div className="admin-panel fb-detail">
      <h2>{work.title}</h2>
      <div className="fb-bars" aria-label="Real views per day">{perDay.length ? perDay.map(([d, n]) => <span key={d} title={`${d}: ${n}`} style={{ height: `${(n / max) * 100}%` }} />) : <small>No real views in this range yet.</small>}</div>
      <p className="fb-note">{views.length} real views in range · {views.length - views.filter((v) => v.viewer_id).length} anonymous · {signed.length} signed in</p>
      {signed.length > 0 && <ul className="fb-viewers">{signed.slice(0, 30).map((id) => <li key={id}>{names[id] ?? 'Signed-in viewer'}</li>)}</ul>}
      <p className="fb-note">Reactions: {Object.entries(reactions).map(([k, n]) => `${reactionMeta(k).emoji} ${n}`).join('  ') || 'none yet'}</p>
      <div className="fb-form">
        <label>Starting views<input inputMode="numeric" value={baseViews} onChange={(e) => setBaseViews(e.target.value.replace(/\D/g, ''))} /></label>
        <label>Starting reactions<input inputMode="numeric" value={baseReactions} onChange={(e) => setBaseReactions(e.target.value.replace(/\D/g, ''))} /></label>
        <button className="admin-btn" onClick={() => void save()}>Save</button>
      </div>
      <p className="fb-note">Shown publicly: {compactCount(publicTotal(Number(baseViews) || 0, realTotal))} views (starting number + {realTotal} real).</p>
      <h3>Add a pinned comment</h3>
      <div className="fb-form fb-form-col">
        <select value={kind} onChange={(e) => setKind(e.target.value as 'team' | 'client')}><option value="team">From Admakai team</option><option value="client">Real client feedback</option></select>
        {kind === 'client' && <input placeholder="Client name (as they agreed to be shown)" value={label} maxLength={80} onChange={(e) => setLabel(e.target.value)} />}
        <textarea rows={3} maxLength={1000} placeholder="Comment" value={body} onChange={(e) => setBody(e.target.value)} />
        <button className="admin-btn" onClick={() => void add()}>Add comment</button>
      </div>
    </div>
  );
}
