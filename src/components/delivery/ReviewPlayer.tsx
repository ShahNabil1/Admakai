import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatTimecode } from '@/lib/timecode';
import './delivery.css';

export type Deliverable = { id: string; project_id: string; title: string; version: number; status: string; storage_path: string | null; external_url: string | null; created_at: string };
type Comment = { id: string; author_id: string; timecode_ms: number | null; body: string; resolved: boolean; created_at: string };

export function ReviewPlayer({ deliverable, mode, userId, onChanged }: { deliverable: Deliverable; mode: 'staff' | 'client'; userId: string; onChanged?: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [url, setUrl] = useState<string | null>(deliverable.external_url);
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState('');
  const [pinTime, setPinTime] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isVideo = !!deliverable.storage_path && /\.(mp4|mov|webm)$/i.test(deliverable.storage_path);
  const isImage = !!deliverable.storage_path && /\.(jpe?g|png|webp)$/i.test(deliverable.storage_path);

  useEffect(() => {
    if (!deliverable.storage_path) return;
    let alive = true;
    // 15-minute signed link; storage policies verify project access.
    void supabase.storage.from('deliverables').createSignedUrl(deliverable.storage_path, 900).then(({ data }) => { if (alive) setUrl(data?.signedUrl ?? null); });
    return () => { alive = false; };
  }, [deliverable.storage_path]);

  const load = useCallback(async () => {
    const { data } = await supabase.from('review_comments').select('id, author_id, timecode_ms, body, resolved, created_at').eq('deliverable_id', deliverable.id).order('timecode_ms', { ascending: true, nullsFirst: false }).order('created_at');
    setComments((data ?? []) as Comment[]);
  }, [deliverable.id]);

  useEffect(() => {
    void load();
    const ch = supabase.channel(`review-${deliverable.id}-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'review_comments', filter: `deliverable_id=eq.${deliverable.id}` }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [deliverable.id, load]);

  const add = async () => {
    const text = body.trim();
    if (!text) return;
    setBusy(true); setMsg(null);
    const t = isVideo && pinTime && video.current ? Math.round(video.current.currentTime * 1000) : null;
    const { error } = await supabase.from('review_comments').insert({ deliverable_id: deliverable.id, author_id: userId, body: text.slice(0, 2000), timecode_ms: t });
    setBusy(false);
    if (error) { setMsg('Comment could not be saved.'); return; }
    setBody(''); void load();
  };

  const decide = async (status: 'approved' | 'changes_requested') => {
    setBusy(true); setMsg(null);
    const { error } = await supabase.from('deliverables').update({ status }).eq('id', deliverable.id);
    setBusy(false);
    if (error) setMsg(error.message.includes('revision limit') ? 'All included revisions have been used for this deliverable.' : 'Your decision could not be saved.');
    else onChanged?.();
  };

  const seek = (ms: number | null) => { if (ms != null && video.current) { video.current.currentTime = ms / 1000; void video.current.play().catch(() => {}); } };
  const awaiting = deliverable.status === 'submitted' || deliverable.status === 'resubmitted';

  return (
    <div className="review">
      <div className="review-media">
        {!url ? <p className="review-empty">Preparing a secure preview…</p>
          : isVideo ? <video ref={video} src={url} controls playsInline preload="metadata" />
          : isImage ? <img src={url} alt={deliverable.title} />
          : <a className="review-open" href={url} target="_blank" rel="noreferrer">Open {deliverable.title}</a>}
        {isVideo && comments.some((c) => c.timecode_ms != null) && (
          <p className="review-hint">Click a timecode to jump to that moment.</p>
        )}
      </div>
      <aside className="review-side">
        <header>
          <strong>{deliverable.title} <small>v{deliverable.version}</small></strong>
          <span className={`review-status is-${deliverable.status}`}>{deliverable.status.replace('_', ' ')}</span>
        </header>
        <ol className="review-thread">
          {comments.length === 0 && <li className="review-empty">No comments yet.</li>}
          {comments.map((c) => (
            <li key={c.id} className={c.resolved ? 'is-resolved' : ''}>
              {c.timecode_ms != null && <button type="button" className="review-tc" onClick={() => seek(c.timecode_ms)}>{formatTimecode(c.timecode_ms)}</button>}
              <p>{c.body}</p>
              <small>{c.author_id === userId ? 'You' : 'Team'} · {new Date(c.created_at).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', dateStyle: 'medium', timeStyle: 'short' })}</small>
              {mode === 'staff' && !c.resolved && <button type="button" className="admin-link" onClick={async () => { await supabase.from('review_comments').update({ resolved: true }).eq('id', c.id); void load(); }}>Resolve</button>}
            </li>
          ))}
        </ol>
        <div className="review-compose">
          <label htmlFor={`c-${deliverable.id}`} className="sr-only">Add a comment</label>
          <textarea id={`c-${deliverable.id}`} value={body} maxLength={2000} rows={3} placeholder="Add a comment…" onChange={(e) => setBody(e.target.value)} />
          <div>
            {isVideo && <label className="review-pin"><input type="checkbox" checked={pinTime} onChange={(e) => setPinTime(e.target.checked)} /> Pin to current time</label>}
            <button type="button" className="admin-btn" disabled={busy || !body.trim()} onClick={add}>Comment</button>
          </div>
        </div>
        {mode === 'client' && awaiting && (
          <div className="review-decide">
            <button type="button" className="admin-btn" disabled={busy} onClick={() => decide('approved')}>Approve</button>
            <button type="button" className="review-secondary" disabled={busy} onClick={() => decide('changes_requested')}>Request changes</button>
          </div>
        )}
        {msg && <p className="admin-alert" role="alert">{msg}</p>}
      </aside>
    </div>
  );
}
