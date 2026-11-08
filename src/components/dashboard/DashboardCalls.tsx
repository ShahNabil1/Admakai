import { useState } from 'react';
import { CalendarDays, Plus, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { CallItem } from '@/components/client/ClientPages';
import { ClientUploads } from '@/components/client/ClientUploads';
import { SlotBookingPage } from '@/components/public/SlotBookingPage';
import { nextCall } from '@/lib/client-rules';
import { useAccount } from '@/components/account/useAccount';
import '@/components/public/slot-booking.css';

export function DashboardCalls({ book, onBookChange }: { book: boolean; onBookChange: (open: boolean) => void }) {
  const a = useAccount();
  const cache = useQueryClient();
  const [bookedOnce, setBookedOnce] = useState(false);
  const now = a.now;
  const bookings = a.client?.bookings ?? [];
  const upcoming = bookings.filter(b => ['requested', 'in_review', 'confirmed', 'rescheduled'].includes(b.status) && Date.parse(b.slot_at) > now - 90 * 60000).sort((x, y) => Date.parse(x.slot_at) - Date.parse(y.slot_at));
  const past = bookings.filter(b => !upcoming.includes(b));
  const next = now ? nextCall(bookings, now) : undefined;
  const booked = () => { setBookedOnce(true); void cache.invalidateQueries({ queryKey: ['client-area'] }); };
  const prefill = { name: a.summary?.fullName ?? a.name ?? '', email: a.user?.email ?? '', whatsapp: a.summary?.whatsapp ?? a.candidate?.candidate?.whatsapp ?? '' };

  return <>
    <div className="dashboard-heading"><h1>Calls</h1>{!book && <Button onClick={() => onBookChange(true)}><Plus size={16} />Book a call</Button>}</div>
    {book && <section className="dashboard-booking" aria-label="Book a call">
      <Button variant="ghost" size="icon" className="dashboard-booking-close" aria-label="Close booking" onClick={() => onBookChange(false)}><X /></Button>
      {a.summary || !a.user ? <SlotBookingPage embedded prefill={prefill} onBooked={booked} /> : <p role="status">Loading…</p>}
    </section>}
    {bookedOnce && !book && <p role="status" className="candidate-muted">Your call request is in the list below.</p>}
    {a.loading ? <p role="status" className="candidate-muted">Loading your calls…</p> : bookings.length ? <>
      {!!upcoming.length && <section className="dashboard-calls"><h2>Upcoming calls</h2><div className="client-calls-list">{upcoming.map(c => <CallItem key={c.id} call={c} host={a.client?.hosts[c.id]} now={now} />)}</div></section>}
      {next && a.client && <div className="dashboard-calls"><ClientUploads bookingId={next.id} manager={a.client.manager} /></div>}
      {!!past.length && <section className="dashboard-calls"><h2>Past calls</h2><div className="client-calls-list">{past.map(c => <CallItem key={c.id} call={c} host={a.client?.hosts[c.id]} now={now} />)}</div></section>}
    </> : !book && <div className="candidate-empty"><CalendarDays size={34} /><h2>No calls yet</h2><Button onClick={() => onBookChange(true)}>Book a call</Button></div>}
  </>;
}
