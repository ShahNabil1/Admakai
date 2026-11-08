import { useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-state';
import {
  COMMENT_MAX, REACTIONS, compactCount, fetchComments, fetchStats, initials, reactionMeta, validateComment, type ReactionKind,
} from '@/lib/work-feedback';
import './work-feedback.css';

export const workStatsKey = (id: string) => ['work-feedback', 'stats', id] as const;

/** Views + reaction bar shown under the watch-page title. */
export function WorkStatsBar({ workId, slug }: { workId: string; slug: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const stats = useQuery({ queryKey: workStatsKey(workId), queryFn: () => fetchStats([workId]).then((m) => m[workId] ?? null), staleTime: 30000 });
  const mine = useQuery({
    queryKey: ['work-feedback', 'mine', workId, user?.id], enabled: Boolean(user),
    queryFn: async () => (await supabase.from('work_reactions').select('kind').eq('work_id', workId).eq('user_id', user!.id).maybeSingle()).data?.kind ?? null,
  });
  const [open, setOpen] = useState(false);
  const press = useRef<ReturnType<typeof setTimeout> | null>(null);
  const react = useMutation({
    mutationFn: async (kind: ReactionKind | null) => {
      if (!user) throw new Error('signin');
      const r = kind == null
        ? await supabase.from('work_reactions').delete().eq('work_id', workId).eq('user_id', user.id)
        : await supabase.from('work_reactions').upsert({ work_id: workId, user_id: user.id, kind }, { onConflict: 'work_id,user_id' });
      if (r.error) { console.error('reaction failed', r.error); throw new Error('save'); }
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['work-feedback'] }); },
    onError: () => toast.error('Could not save your reaction. Please try again.'),
  });
  const current = mine.data ?? null;
  const choose = (kind: ReactionKind) => { setOpen(false); react.mutate(current === kind ? null : kind); };
  const s = stats.data;
  const top = s?.top_kinds?.length ? s.top_kinds : ['like'];

  return (
    <div className="wf-bar">
      <span className="wf-views"><Eye size={16} aria-hidden="true" />{s ? `${compactCount(s.views)} views` : '\u00a0'}</span>
      <span className="wf-react-summary" aria-label={s ? `${s.reactions} reactions` : undefined}>
        <span className="wf-emojis">{top.slice(0, 3).map((k) => <i key={k}>{reactionMeta(k).emoji}</i>)}</span>
        {s ? compactCount(s.reactions) : ''}
      </span>
      <span className="wf-comment-count"><MessageCircle size={15} aria-hidden="true" />{s ? `${compactCount(s.comments)} comments` : ''}</span>
      {user ? (
        <span className="wf-react" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
          <button type="button" className={`wf-react-btn${current ? ' is-on' : ''}`} aria-haspopup="true" aria-expanded={open}
            onClick={() => (current ? react.mutate(null) : choose('like'))}
            onTouchStart={() => { press.current = setTimeout(() => setOpen(true), 450); }}
            onTouchEnd={() => { if (press.current) clearTimeout(press.current); }}
            onKeyDown={(e) => { if (e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); } }}>
            <span aria-hidden="true">{reactionMeta(current ?? 'like').emoji}</span>{current ? reactionMeta(current).label : 'React'}
          </button>
          {open && (
            <span className="wf-picker" role="menu">
              {REACTIONS.map((r) => (
                <button key={r.kind} type="button" role="menuitem" title={r.label} aria-label={r.label} className={current === r.kind ? 'is-on' : ''} onClick={() => choose(r.kind)}>{r.emoji}</button>
              ))}
            </span>
          )}
        </span>
      ) : (
        <Link to="/signin" search={{ redirect: `/work/${slug}` }} className="wf-react-btn">👍 Sign in to react</Link>
      )}
    </div>
  );
}

/** Comment list + composer. New comments wait for admin approval. */
export function WorkComments({ workId, slug }: { workId: string; slug: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ['work-feedback', 'comments', workId, user?.id ?? 'anon'], queryFn: () => fetchComments(workId) });
  const [body, setBody] = useState('');
  const send = useMutation({
    mutationFn: async () => {
      const problem = validateComment(body); if (problem) throw new Error(problem);
      const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
      const name = String(meta['full_name'] || meta['name'] || user?.email?.split('@')[0] || 'Viewer').slice(0, 80);
      const { error } = await supabase.from('work_comments').insert({ work_id: workId, user_id: user!.id, author_label: name, body: body.trim() });
      if (error) { console.error('comment failed', error); throw new Error('Could not send your comment. Please try again.'); }
    },
    onSuccess: () => { setBody(''); toast.success('Thanks! Your comment will appear after a quick review.'); void qc.invalidateQueries({ queryKey: ['work-feedback'] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const rows = (list.data ?? []).filter((c) => c.status === 'approved' || (user && c.user_id === user.id && c.status === 'pending'));

  return (
    <section className="wf-comments" aria-labelledby="wf-comments-title">
      <h2 id="wf-comments-title">Comments</h2>
      {user ? (
        <form className="wf-compose" onSubmit={(e) => { e.preventDefault(); send.mutate(); }}>
          <span className="wf-avatar">{initials(String((user.user_metadata as Record<string, unknown>)?.['full_name'] || user.email || '?'))}</span>
          <div>
            <textarea value={body} maxLength={COMMENT_MAX} rows={2} placeholder="Add a comment…" aria-label="Add a comment" onChange={(e) => setBody(e.target.value)} />
            <div className="wf-compose-foot"><small>{body.length}/{COMMENT_MAX}</small><button type="submit" disabled={!body.trim() || send.isPending}>{send.isPending ? 'Sending…' : 'Comment'}</button></div>
          </div>
        </form>
      ) : (
        <p className="wf-signin"><Link to="/signin" search={{ redirect: `/work/${slug}` }}>Sign in</Link> to leave a comment.</p>
      )}
      {list.isError ? <p className="wf-empty">Comments could not load right now.</p> : rows.length === 0 && !list.isPending ? <p className="wf-empty">No comments yet. Be the first.</p> : null}
      <ul className="wf-list">
        {rows.map((c) => (
          <li key={c.id} className={c.team_kind ? 'is-team' : ''}>
            <span className="wf-avatar">{c.team_kind === 'team' ? 'A' : initials(c.author_label)}</span>
            <div>
              <p className="wf-meta"><strong>{c.team_kind === 'team' ? 'Admakai team' : c.author_label}</strong>
                {c.team_kind === 'client' && <em>Client feedback</em>}
                {c.pinned && <em>Pinned</em>}
                {c.status === 'pending' && <em className="is-wait">Waiting for approval</em>}
                <time dateTime={c.created_at}>{new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</time></p>
              <p className="wf-body">{c.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
