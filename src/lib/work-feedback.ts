import { supabase } from './supabase';

/** LinkedIn-style reaction set, in display order. */
export const REACTIONS = [
  { kind: 'like', label: 'Like', emoji: '👍' },
  { kind: 'celebrate', label: 'Celebrate', emoji: '👏' },
  { kind: 'support', label: 'Support', emoji: '🤝' },
  { kind: 'love', label: 'Love', emoji: '❤️' },
  { kind: 'insightful', label: 'Insightful', emoji: '💡' },
  { kind: 'funny', label: 'Funny', emoji: '😄' },
] as const;
export type ReactionKind = (typeof REACTIONS)[number]['kind'];
export const reactionMeta = (kind: string) => REACTIONS.find((r) => r.kind === kind) ?? REACTIONS[0];

export const COMMENT_MAX = 1000;
/** Seconds of playback before a visit counts as a real view. */
export const VIEW_AFTER_SECONDS = 3;
export const VIEW_WINDOW_HOURS = 24;

/** Public total = admin starting number + real count. */
export const publicTotal = (base: number, real: number) => Math.max(0, base | 0) + Math.max(0, real | 0);

/** Compact count: 950, 1.2K, 13K, 1.3M. */
export function compactCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) { const v = n / 1000; return `${v < 10 ? Math.floor(v * 10) / 10 : Math.floor(v)}K`; }
  const v = n / 1_000_000; return `${v < 10 ? Math.floor(v * 10) / 10 : Math.floor(v)}M`;
}

/** Client mirror of the SQL 24-hour dedupe, used to skip pointless calls. */
export function shouldCountView(lastCountedAt: number | null, now: number): boolean {
  return lastCountedAt == null || now - lastCountedAt >= VIEW_WINDOW_HOURS * 3600_000;
}

export function validateComment(body: string): string | null {
  const t = body.trim();
  if (!t) return 'Write something first.';
  if (t.length > COMMENT_MAX) return `Keep it under ${COMMENT_MAX} characters.`;
  return null;
}

export function visitorId(): string {
  const key = 'admakai-visitor';
  let id = localStorage.getItem(key);
  if (!id || id.length < 8) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
  return id;
}

export async function recordView(workId: string) {
  const key = `admakai-viewed-${workId}`;
  const last = Number(localStorage.getItem(key)) || null;
  if (!shouldCountView(last, Date.now())) return;
  localStorage.setItem(key, String(Date.now()));
  await supabase.rpc('record_work_view', { _work_id: workId, _visitor_id: visitorId() });
}

export type WorkStats = { work_id: string; views: number; reactions: number; comments: number; top_kinds: string[] };
export async function fetchStats(ids: string[]): Promise<Record<string, WorkStats>> {
  if (!ids.length) return {};
  const { data, error } = await supabase.rpc('work_public_stats', { _work_ids: ids });
  if (error) throw new Error(error.message);
  return Object.fromEntries(((data ?? []) as WorkStats[]).map((s) => [s.work_id, { ...s, views: Number(s.views), reactions: Number(s.reactions), comments: Number(s.comments) }]));
}

export type WorkComment = { id: string; work_id: string; user_id: string | null; author_label: string; body: string; status: 'pending' | 'approved' | 'hidden'; team_kind: 'team' | 'client' | null; pinned: boolean; created_at: string };
export async function fetchComments(workId: string): Promise<WorkComment[]> {
  const { data, error } = await supabase.from('work_comments').select('id, work_id, user_id, author_label, body, status, team_kind, pinned, created_at')
    .eq('work_id', workId).order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as WorkComment[];
}

export function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}
