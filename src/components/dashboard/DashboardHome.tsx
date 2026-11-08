import { Link } from '@tanstack/react-router';
import { ArrowUpRight, BriefcaseBusiness, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { firstName, canJoin, safeMeetLink } from '@/lib/client-rules';
import { dhakaDate } from '@/lib/candidate-rules';
import { useAccount } from '@/components/account/useAccount';
import { CandidateActionCards, Status } from '@/components/careers/CandidateDashboard';

export function DashboardHome() {
  const a = useAccount();
  const name = firstName(a.name);
  const host = a.call && a.client?.hosts[a.call.id];
  return <>
    <h1>{name ? `Hello, ${name}.` : 'Hello.'}</h1>
    {a.loading && <p role="status" className="candidate-muted">Loading your account…</p>}
    <div className="dashboard-cards">
      {a.call && <article className="candidate-card">
        <p className="candidate-code">Next call</p>
        <h2>{dhakaDate(a.call.slot_at, true)}</h2>
        <p className="candidate-muted">Asia/Dhaka · {a.call.duration_minutes} minutes{host ? ` · With ${host}` : ''}</p>
        <div className="candidate-actions">
          {canJoin(a.call, a.now) ? <Button asChild><a href={safeMeetLink(a.call.meet_link) ?? undefined} target="_blank" rel="noreferrer">Join call<ArrowUpRight size={14} /></a></Button>
            : <Button asChild variant="outline"><Link to="/dashboard/calls">View call</Link></Button>}
        </div>
      </article>}
      {a.latest && a.candidate && <article className="candidate-card">
        <header><div><p className="candidate-code">Latest application</p><h2>{a.latestJob?.title ?? 'Application'}</h2></div><Status data={a.candidate} app={a.latest} /></header>
        <div className="candidate-actions"><Button asChild variant="outline"><Link to="/dashboard/applications/$id" params={{ id: a.latest.id }}>Track</Link></Button></div>
      </article>}
      {a.journey && <article className="candidate-card">
        <p className="candidate-code">Your journey</p>
        <h2>{a.journey.label}</h2>
        <p className="candidate-muted">Day {a.journey.day}{a.journey.expected ? ` of about ${a.journey.expected}` : ''} in this stage</p>
        {a.journey.expected ? <progress className="candidate-journey-progress" value={Math.min(a.journey.day, a.journey.expected)} max={a.journey.expected} /> : null}
        <div className="candidate-actions"><Button asChild variant="outline"><Link to="/dashboard/journey">Open journey</Link></Button></div>
      </article>}
    </div>
    {a.candidate && <CandidateActionCards data={a.candidate} />}
    <div className="dashboard-shortcuts">
      <Link to="/dashboard/calls" search={{ book: true }} className="dashboard-shortcut"><CalendarDays /><span><strong>Book a call with our team</strong><small>Pick a time that suits you, in Dhaka time.</small></span><ArrowUpRight /></Link>
      <Link to="/dashboard/careers" search={{ tab: 'roles' }} className="dashboard-shortcut"><BriefcaseBusiness /><span><strong>See open roles</strong><small>Internships and jobs at Admakai.</small></span><ArrowUpRight /></Link>
    </div>
  </>;
}
