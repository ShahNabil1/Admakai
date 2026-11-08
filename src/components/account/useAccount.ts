import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useAuth } from '@/lib/auth-state';
import { getAccountSummary } from '@/lib/account.functions';
import { getClientArea } from '@/lib/client.functions';
import { candidateWorkspace } from '@/lib/candidate.functions';
import { candidateJourneys } from '@/lib/hiring-journey.functions';
import { nextCall } from '@/lib/client-rules';
import { journeyDays } from '@/lib/hiring-journey-rules';
import { accountBadge, primaryStatus } from '@/lib/account-rules';
import { useCandidateActions } from '@/components/careers/CandidateDashboard';

export function useNow(interval = 30000) {
  const [now, setNow] = useState(0);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), interval); return () => clearInterval(t); }, [interval]);
  return now;
}

/** Everything the header menu and dashboard Home show, from the existing private reads. */
export function useAccount() {
  const { user } = useAuth();
  const enabled = !!user;
  const readSummary = useServerFn(getAccountSummary), readClient = useServerFn(getClientArea), readCandidate = useServerFn(candidateWorkspace), readJourneys = useServerFn(candidateJourneys);
  const summary = useQuery({ queryKey: ['account', 'summary', user?.id], queryFn: () => readSummary(), enabled, staleTime: 60000, retry: false });
  const client = useQuery({ queryKey: ['client-area'], queryFn: () => readClient(), enabled, staleTime: 30000, retry: false });
  const candidate = useQuery({ queryKey: ['candidate', 'workspace'], queryFn: () => readCandidate(), enabled, staleTime: 15000, retry: false });
  const hasJourney = !!candidate.data?.journeys?.length;
  const journeys = useQuery({ queryKey: ['candidate', 'journeys'], queryFn: () => readJourneys(), enabled: enabled && hasJourney, retry: false });
  const now = useNow();

  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const googlePhoto = typeof meta['avatar_url'] === 'string' ? meta['avatar_url'] : typeof meta['picture'] === 'string' ? meta['picture'] : null;
  const name = summary.data?.fullName || candidate.data?.candidate?.full_name || (typeof meta['full_name'] === 'string' ? meta['full_name'] : null);
  const avatar = summary.data?.avatarUrl || googlePhoto || candidate.data?.photoUrl || null;

  const call = now && client.data ? nextCall(client.data.bookings, now) : undefined;
  const cw = candidate.data;
  const interviewRow = cw?.interviews.filter(i => i.status !== 'cancelled' && Date.parse(i.scheduled_at) + i.duration_minutes * 60000 > now).sort((a, b) => Date.parse(a.scheduled_at) - Date.parse(b.scheduled_at))[0];
  const interviewJob = interviewRow && cw?.jobs.find(j => j.id === cw.applications.find(a => a.id === interviewRow.application_id)?.job_id);
  const latest = cw?.applications.find(a => !a.is_draft);
  const latestJob = latest && cw?.jobs.find(j => j.id === latest.job_id);
  const latestStage = latest && latestJob && cw?.stages.find(s => s.pipeline_id === latestJob.application_pipeline_id && s.key === latest.status_key);
  const j = journeys.data?.journeys[0];
  const jStage = j && journeys.data?.stages.find(s => s.pipeline_id === j.pipeline_id && s.key === j.stage_key);
  const journey = j ? { label: jStage?.candidate_label ?? j.stage_key, day: journeyDays(j.stage_started_at), expected: jStage?.expected_days ?? null } : null;
  const actions = useCandidateActions(cw, now || undefined);

  const status = primaryStatus({
    call: call ? { at: call.slot_at } : null,
    interview: interviewRow ? { at: interviewRow.scheduled_at, title: interviewJob?.title ?? 'Interview' } : null,
    application: latest ? { label: latestStage?.candidate_label ?? latest.status_key, title: latestJob?.title ?? 'Application', id: latest.id } : null,
    journey,
  });
  const badge = accountBadge({ role: summary.data?.role, hiringAdmin: summary.data?.hiringAdmin, hiringStaff: summary.data?.hiringStaff, member: hasJourney });
  const soon = (at?: string) => !!at && Date.parse(at) - now < 24 * 3600000;
  const attention = actions.length > 0 || soon(call?.slot_at) || soon(interviewRow?.scheduled_at);

  return { user, summary: summary.data, client: client.data, candidate: cw, journeys: journeys.data, hasJourney, name, avatar, call, latest, latestStage, latestJob, journey, status, badge, attention, actions, now, loading: summary.isPending || client.isPending || candidate.isPending };
}
