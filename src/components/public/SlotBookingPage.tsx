import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useHydrated } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ArrowUpRight, Check, RotateCcw, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { resolveSiteSettings } from '@/data/site';
import { whatsappUrl } from '@/lib/lead-schema';
import { bookingFormSchema, needs, budgets, groupSlots, captureBookingSource, skipSpam, dayLabel, timeLabel, type BookingFields, type OpenSlot } from '@/lib/booking-form';
import { fetchOpenSlots, createPublicBooking, sendBookingLink } from '@/lib/booking-api';
import './pages.css';
import './slot-booking.css';

function ChipRow({ label, items, value, onChange }: { label: string; items: { value: string; label: string }[]; value: string; onChange: (value: string) => void }) {
  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role=radio]')];
    const index = buttons.indexOf(event.target as HTMLButtonElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1) + buttons.length) % buttons.length;
    const item = items[next];
    if (item) { onChange(item.value); buttons[next]?.focus(); buttons[next]?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  };
  return <div className={`book-chips ${label === 'Pick a day' ? 'book-days' : label === 'Pick a time' ? 'book-times' : ''}`} role="radiogroup" aria-label={label} onKeyDown={keyboard}>{items.map((item, i) => <Button key={item.value} type="button" variant="outline" className={`book-chip ${value === item.value ? 'selected' : ''}`} role="radio" aria-checked={value === item.value} tabIndex={value === item.value || (!value && i === 0) ? 0 : -1} onClick={() => onChange(item.value)}>{item.label}</Button>)}</div>;
}

export function SlotBookingPage() {
  const hydrated = useHydrated();
  const slots = useQuery({ queryKey: ['booking-open-slots'], queryFn: fetchOpenSlots, enabled: hydrated, staleTime: 0, retry: false, refetchOnWindowFocus: false });
  const { data: settings } = useSiteSettings();
  const site = resolveSiteSettings(settings);
  const whatsapp = whatsappUrl(site.WHATSAPP, 'Hi Admakai, I would like to book a call.');
  const [day, setDay] = useState('');
  const [time, setTime] = useState('');
  const [fields, setFields] = useState<BookingFields>({ name: '', email: '', whatsapp: '', brand: '', need: 'unsure', message: '', budget: 'not_decided' });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState<OpenSlot | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [emailError, setEmailError] = useState('');
  const mountedAt = useRef(0);
  const source = useRef<Record<string, string>>({});
  const honeypot = useRef<HTMLInputElement>(null);
  const submitLock = useRef(false);
  useEffect(() => { mountedAt.current = Date.now(); source.current = captureBookingSource(window.location.href, document.referrer, navigator.userAgent); }, []);
  const groups = groupSlots(slots.data ?? []);
  const selectedDay = groups.some(([key]) => key === day) ? day : (groups[0]?.[0] ?? '');
  const daySlots = groups.find(([key]) => key === selectedDay)?.[1] ?? [];
  const selectedSlot = daySlots.find(slot => slot.slot_at === time);
  const parsed = bookingFormSchema.safeParse(fields);
  const errors: Record<string, string> = {};
  if (!parsed.success) for (const issue of parsed.error.issues) errors[String(issue.path[0])] = issue.message;
  const change = (key: keyof BookingFields, value: string) => setFields(previous => ({ ...previous, [key]: value }));
  const sendEmail = async () => {
    setBusy(true); setEmailError('');
    try { await sendBookingLink(fields.email.trim().toLowerCase()); setEmailSent(true); }
    catch (reason) { setEmailError(reason instanceof Error ? reason.message : 'The email could not be sent.'); }
    finally { setBusy(false); }
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!parsed.success || !selectedSlot || submitLock.current) return;
    if (skipSpam(honeypot.current?.value ?? '', mountedAt.current, Date.now())) { setConfirmation(selectedSlot); setEmailSent(true); return; }
    submitLock.current = true; setBusy(true); setError('');
    try {
      const id = await createPublicBooking(selectedSlot.slot_at, parsed.data, source.current);
      setBookingId(id); setConfirmation(selectedSlot);
      try { await sendBookingLink(parsed.data.email); setEmailSent(true); }
      catch (reason) { setEmailError(reason instanceof Error ? reason.message : 'The email could not be sent.'); }
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Your booking could not be saved. Please try again.';
      if (message.includes('slot_unavailable')) { setError('Someone just took that time. Please pick another available time.'); setTime(''); await slots.refetch(); }
      else if (message.includes('rate_limited')) setError('You already have bookings pending. Please reply to your booking email instead.');
      else setError(message);
    } finally { setBusy(false); submitLock.current = false; }
  };
  const field = (key: 'name' | 'email' | 'whatsapp' | 'brand', label: string, type: string, autoComplete: string) => <div className="booking-field"><label htmlFor={`book-${key}`}>{label}{key === 'brand' ? <span> · optional</span> : <span aria-hidden="true"> *</span>}</label><input id={`book-${key}`} name={key} type={type} autoComplete={autoComplete} value={fields[key]} required={key !== 'brand'} maxLength={key === 'whatsapp' ? 30 : key === 'email' ? 254 : key === 'name' ? 100 : 150} onChange={event => change(key, event.target.value)} onBlur={() => setTouched(previous => ({ ...previous, [key]: true }))} aria-invalid={!!(touched[key] && errors[key])} aria-describedby={`book-${key}-error`}/><p className="book-field-error" id={`book-${key}-error`}>{touched[key] ? errors[key] : ''}</p></div>;
  return <div className="public-page book-page"><div className="book-column"><header className="book-heading"><p className="page-eyebrow">Book a call</p><h1>Let’s talk about <em>your next ad.</em></h1><p>A clear brief. A time that works for you.</p></header>{confirmation ? <section className="book-confirmation" role="status"><span className="book-confirmation-icon"><Check size={24}/></span><h2>Your call is requested.</h2><p className="book-confirmed-date"><CalendarDays size={19}/>{dayLabel(confirmation.local_day, true)} · {timeLabel(confirmation.local_time)}</p><p className="book-zone">Asia/Dhaka (GMT+6)</p>{emailSent ? <><p>We’ve emailed a link that opens your dashboard with no password needed. Add product photos there to make the call far more useful.</p><p className="book-small">Check spam if it doesn’t arrive in a minute.</p></> : <><p>Your booking is saved, but we couldn’t email your sign-in link.</p><p role="alert" className="book-error">{emailError}</p><Button className="page-call" onClick={() => void sendEmail()} disabled={busy}>{busy ? 'Sending link…' : 'Retry email'}<RotateCcw size={16}/></Button></>}{bookingId && <span className="sr-only">Booking saved</span>}</section> : <form onSubmit={event => void submit(event)} noValidate><section className="book-section"><h2><span>01</span>Pick a day</h2>{!hydrated || slots.isPending ? <div className="book-skeleton" aria-label="Loading available days" role="status"><div className="book-skeleton-days">{[0, 1, 2, 3, 4].map(i => <span key={i}/>)}</div><div className="book-skeleton-times">{Array.from({ length: 12 }, (_, i) => <span key={i}/>)}</div></div> : slots.isError ? <div className="book-empty" role="alert"><CalendarDays size={28}/><h3>Available times couldn’t load.</h3><p>Please try again in a moment.</p><Button variant="outline" className="book-chip" onClick={() => void slots.refetch()}><RotateCcw size={16}/>Retry</Button></div> : !groups.length ? <div className="book-empty"><CalendarDays size={28}/><h3>No open times right now.</h3><p>New times will appear here when they become available.</p>{whatsapp ? <Button asChild className="page-call"><a href={whatsapp}><MessageCircle size={16}/>Chat on WhatsApp</a></Button> : <p className="book-small">WhatsApp contact is not available yet.</p>}<Button variant="link" onClick={() => void slots.refetch()} disabled={slots.isFetching}>Check again</Button></div> : <ChipRow label="Pick a day" items={groups.map(([key]) => ({ value: key, label: dayLabel(key) }))} value={selectedDay} onChange={value => { setDay(value); setTime(''); }}/>}</section>{groups.length > 0 && <section className="book-section"><h2><span>02</span>Pick a time</h2><p className="book-zone">Asia/Dhaka (GMT+6)</p><div className="book-time-space"><ChipRow label="Pick a time" items={daySlots.map(slot => ({ value: slot.slot_at, label: timeLabel(slot.local_time) }))} value={time} onChange={setTime}/></div></section>}<section className="book-section"><h2><span>03</span>About you</h2><div className="book-fields">{field('name', 'Your name', 'text', 'name')}{field('whatsapp', 'WhatsApp number', 'tel', 'tel')}{field('email', 'Email', 'email', 'email')}{field('brand', 'Brand or page name', 'text', 'organization')}</div></section><section className="book-section"><h2><span>04</span>What do you need</h2><ChipRow label="What do you need" items={[...needs]} value={fields.need} onChange={value => change('need', value)}/><div className="booking-field book-message"><label htmlFor="book-message">Describe the problem in two lines <span>· optional</span></label><textarea id="book-message" name="message" rows={3} maxLength={2000} value={fields.message} onChange={event => change('message', event.target.value)}/></div><p className="book-budget-label">Budget · BDT</p><ChipRow label="Budget" items={[...budgets]} value={fields.budget} onChange={value => change('budget', value)}/></section><input className="book-honeypot" name="company_website" ref={honeypot} tabIndex={-1} aria-hidden="true" autoComplete="off"/>{error && <div className="book-error" role="alert"><p>{error}</p>{!error.includes('Someone just took') && !error.includes('bookings pending') && <Button type="submit" variant="link" disabled={busy || !selectedSlot || !parsed.success}><RotateCcw size={16}/>Retry</Button>}</div>}<Button type="submit" className="page-call book-submit" disabled={busy || !selectedSlot || !parsed.success}>{busy ? 'Requesting your call…' : 'Book this time'}<ArrowUpRight size={18}/></Button><p className="booking-note">No password. No newsletter. Just your booking.</p></form>}</div></div>;
}