import { Link } from '@tanstack/react-router';
import { CalendarDays, BriefcaseBusiness, FileText, LayoutDashboard, LogOut, MessageCircle, Route as RouteIcon, ShieldCheck, UserRound, PhoneCall } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-state';
import { initials, type StatusCard } from '@/lib/account-rules';
import { dhakaDate } from '@/lib/candidate-rules';
import { useAccount } from './useAccount';
import './account.css';

export function AccountAvatar({ name, email, src, dot = false, size = 36 }: { name?: string | null | undefined; email?: string | null | undefined; src?: string | null | undefined; dot?: boolean; size?: number }) {
  return <span className="account-avatar" style={{ width: size, height: size }}>
    {src ? <img src={src} alt="" referrerPolicy="no-referrer" /> : <span aria-hidden="true">{initials(name, email)}</span>}
    {dot && <span className="account-dot" aria-label="Something needs your attention" />}
  </span>;
}

export function AccountStatus({ status }: { status: StatusCard | null }) {
  if (!status) return null;
  if (status.kind === 'call' || status.kind === 'interview') return <Link to={status.kind === 'call' ? '/dashboard/calls' : '/dashboard/careers'} className="account-status">
    <small>{status.kind === 'call' ? 'Upcoming call' : 'Upcoming interview'}</small><strong>{status.title}</strong><span>{dhakaDate(status.at, true)} · Dhaka</span></Link>;
  if (status.kind === 'application') return <Link to="/dashboard/applications/$id" params={{ id: status.id }} className="account-status">
    <small>Latest application</small><strong>{status.title}</strong><span className="account-pill">{status.label}</span></Link>;
  return <Link to="/dashboard/journey" className="account-status"><small>Your journey</small><strong>{status.label}</strong>
    <span>Day {status.day}{status.expected ? ` of about ${status.expected}` : ''}</span>{status.expected ? <progress value={Math.min(status.day, status.expected)} max={status.expected} /> : null}</Link>;
}

export function accountLinks(hasJourney: boolean, canOpenAdmin: boolean) {
  return [
    { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { to: '/dashboard/calls', label: 'Calls', Icon: CalendarDays },
    { to: '/dashboard/careers', label: 'Careers', Icon: BriefcaseBusiness },
    { to: '/dashboard/documents', label: 'Documents', Icon: FileText },
    { to: '/dashboard/profile', label: 'Profile', Icon: UserRound },
    ...(hasJourney ? [{ to: '/dashboard/journey', label: 'Journey', Icon: RouteIcon }] : []),
    ...(canOpenAdmin ? [{ to: '/admin', label: 'Admin panel', Icon: ShieldCheck }] : []),
  ] as const;
}

function Identity({ a }: { a: ReturnType<typeof useAccount> }) {
  return <div className="account-identity">
    <AccountAvatar name={a.name} email={a.user?.email} src={a.avatar} size={44} />
    <div><strong>{a.name || a.user?.email}</strong>{a.name && <span>{a.user?.email}</span>}</div>
    {a.badge && <span className="account-badge">{a.badge}</span>}
  </div>;
}

/** Signed-in header avatar with the account dropdown; signed out it is an outline Sign in button. */
export function AccountMenu() {
  const { user, ready, signOut } = useAuth();
  const a = useAccount();
  if (!ready) return <span className="account-placeholder" aria-hidden="true" />;
  if (!user) return <Button asChild variant="outline" className="account-signin"><Link to="/signin">Sign in</Link></Button>;
  return <DropdownMenu modal={false}>
    <DropdownMenuTrigger asChild><button type="button" className="account-trigger" aria-label="Open account menu"><AccountAvatar name={a.name} email={user.email} src={a.avatar} dot={a.attention} /></button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" sideOffset={10} className="account-menu" data-lenis-prevent>
      <Identity a={a} />
      <AccountStatus status={a.status} />
      <nav aria-label="Account">
        {accountLinks(a.hasJourney, !!a.summary?.canOpenAdmin).map(({ to, label, Icon }) => <DropdownMenuItem asChild key={to}><Link to={to}><Icon />{label}</Link></DropdownMenuItem>)}
      </nav>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild><Link to="/dashboard/calls" search={{ book: true }}><PhoneCall />Book a call</Link></DropdownMenuItem>
      {a.summary?.helpUrl && <DropdownMenuItem asChild><a href={a.summary.helpUrl} target="_blank" rel="noopener noreferrer"><MessageCircle />Help on WhatsApp</a></DropdownMenuItem>}
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => void signOut()}><LogOut />Sign out</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}

/** Same account content for the mobile menu. */
export function MobileAccountSection({ onNavigate }: { onNavigate: () => void }) {
  const { user, ready, signOut } = useAuth();
  const a = useAccount();
  if (!ready || !user) return null;
  return <section className="account-mobile" aria-label="Account">
    <Identity a={a} />
    <AccountStatus status={a.status} />
    <div className="account-mobile-links">
      {accountLinks(a.hasJourney, !!a.summary?.canOpenAdmin).map(({ to, label, Icon }) => <Link key={to} to={to} onClick={onNavigate}><Icon />{label}</Link>)}
      {a.summary?.helpUrl && <a href={a.summary.helpUrl} target="_blank" rel="noopener noreferrer"><MessageCircle />Help on WhatsApp</a>}
      <button type="button" onClick={() => { onNavigate(); void signOut(); }}><LogOut />Sign out</button>
    </div>
  </section>;
}

