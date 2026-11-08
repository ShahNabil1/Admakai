import { Link, Outlet } from '@tanstack/react-router';
import { BriefcaseBusiness, CalendarDays, FileText, Home, Route as RouteIcon, UserRound } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useCandidateWorkspace } from '@/components/careers/CandidateDashboard';
import '@/components/careers/application.css';
import '@/components/careers/candidate.css';
import '@/components/client/client-area.css';
import './dashboard.css';

const base = [
  { to: '/dashboard', label: 'Home', Icon: Home },
  { to: '/dashboard/calls', label: 'Calls', Icon: CalendarDays },
  { to: '/dashboard/careers', label: 'Careers', Icon: BriefcaseBusiness },
  { to: '/dashboard/documents', label: 'Documents', Icon: FileText },
  { to: '/dashboard/profile', label: 'Profile', Icon: UserRound },
] as const;

/** One account shell for every signed-in visitor: left menu on desktop, bottom tabs on mobile. */
export function DashboardShell() {
  const { data } = useCandidateWorkspace();
  const items = data?.journeys?.length ? [...base, { to: '/dashboard/journey' as const, label: 'Journey', Icon: RouteIcon }] : base;
  return <>
    <Navbar hero />
    <main className="candidate-page dashboard-page">
      <div className="candidate-wrap">
        <nav className="candidate-menu" aria-label="Dashboard menu">{items.map(({ to, label, Icon }) => <Link to={to} key={to} activeOptions={{ exact: to === '/dashboard' }}><Icon size={17} />{label}</Link>)}</nav>
        <div className="candidate-content"><Outlet /></div>
      </div>
      <nav className="candidate-mobile-tabs dashboard-tabs" style={{ gridTemplateColumns: `repeat(${items.length},minmax(0,1fr))` }} aria-label="Dashboard tabs">{items.map(({ to, label, Icon }) => <Link to={to} key={to} activeOptions={{ exact: to === '/dashboard' }}><Icon size={20} />{label}</Link>)}</nav>
    </main>
    <Footer />
  </>;
}
