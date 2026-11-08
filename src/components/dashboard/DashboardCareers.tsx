import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
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
  if (isPending) return <p role="status" className="candidate-muted">Loading open roles…</p>;
  if (error) return <p role="alert">Open roles could not load. Please try again.</p>;
  const jobs = Array.isArray(data) ? data : [];
  if (!jobs.length) return <div className="candidate-empty"><h2>No open roles right now</h2><p className="candidate-muted">Join the talent pool on the careers page and we will reach out.</p><Button asChild variant="outline"><Link to="/careers">Go to careers</Link></Button></div>;
  return <div className="candidate-cards">{jobs.map(job => <article className="candidate-card" key={job.id}>
    <header><div><h2>{job.title}</h2><p className="candidate-code">{[job.type, job.work_mode].filter(Boolean).join(' · ')}</p></div></header>
    {job.summary && <p className="candidate-muted">{job.summary}</p>}
    <div className="candidate-actions"><Button asChild><Link to="/careers/$slug/apply" params={{ slug: job.slug }}>Apply</Link></Button><Button asChild variant="outline"><Link to="/careers/$slug" params={{ slug: job.slug }}>Details</Link></Button></div>
  </article>)}</div>;
}
