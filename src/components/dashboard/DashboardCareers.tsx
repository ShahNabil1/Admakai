import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { listSavedJobs } from '@/lib/saved-jobs.functions';
import { useAuth } from '@/lib/auth-state';
import { Button } from '@/components/ui/button';
import { careerJobsOptions } from '@/lib/careers-query';
import { ApplicationList } from '@/components/careers/CandidateDashboard';

export function DashboardCareers({ tab, onTab }: { tab: 'applications' | 'roles'; onTab: (t: 'applications' | 'roles') => void }) {
  return <>
    <h1>Careers</h1>
    <div className="dashboard-tabs-row" role="tablist" aria-label="Careers">
      <button type="button" role="tab" aria-selected={tab === 'applications'} onClick={() => onTab('applications')}>My applications</button>
      <button type="button" role="tab" aria-selected={tab === 'roles'} onClick={() => onTab('roles')}>Open roles</button>
    </div>
    <div role="tabpanel">{tab === 'applications' ? <ApplicationList onOpenRoles={() => onTab('roles')} /> : <OpenRoles />}</div>
  </>;
}

function OpenRoles() {
  const { data, isPending, error } = useQuery(careerJobsOptions);
  const { user } = useAuth();
  const list = useServerFn(listSavedJobs);
  const savedIds = useQuery({ queryKey: ['careers', 'saved', user?.id], queryFn: () => list(), enabled: !!user, staleTime: 30_000 }).data ?? [];
  if (isPending) return <p role="status" className="candidate-muted">Loading open roles…</p>;
  if (error) return <p role="alert">Open roles could not load. Please try again.</p>;
  const all = Array.isArray(data) ? data : [];
  // Saved roles first, in the order they were saved; the rest keep the board order.
  const jobs = [...savedIds.flatMap(id => all.filter(j => j.id === id)), ...all.filter(j => !savedIds.includes(j.id))];
  if (!jobs.length) return <div className="candidate-empty"><h2>No open roles right now</h2><p className="candidate-muted">Join the talent pool on the careers page and we will reach out.</p><Button asChild variant="outline"><Link to="/careers">Go to careers</Link></Button></div>;
  return <div className="candidate-cards">{jobs.map(job => <article className="candidate-card" key={job.id}>
    <header><div><h2>{job.title}{savedIds.includes(job.id) && <span className="candidate-status positive dashboard-saved-pill">Saved</span>}</h2><p className="candidate-code">{[job.type, job.work_mode].filter(Boolean).join(' · ')}</p></div></header>
    {job.summary && <p className="candidate-muted">{job.summary}</p>}
    <div className="candidate-actions"><Button asChild><Link to="/careers/$slug/apply" params={{ slug: job.slug }}>Apply</Link></Button><Button asChild variant="outline"><Link to="/careers/$slug" params={{ slug: job.slug }}>Details</Link></Button></div>
  </article>)}</div>;
}
