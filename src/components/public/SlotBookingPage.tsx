import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useHydrated } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ArrowLeft, Check, RotateCcw, MessageCircle, LoaderCircle, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMotionPreference } from '@/hooks/use-motion-preference';
import panel from '@/assets/book/panel.jpg.asset.json';
import { BookingCalendar } from './BookingCalendar';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { resolveSiteSettings } from '@/data/site';
import { whatsappUrl } from '@/lib/lead-schema';
import { bookingFormSchema, budgets, groupSlots, captureBookingSource, skipSpam, dayLabel, normalizePhoneInput, type BookingFields, type OpenSlot } from '@/lib/booking-form';
import { fetchOpenSlots, createPublicBooking, sendBookingLink } from '@/lib/booking-api';

import './slot-booking.css';

const services = [
  { value: 'tvc', title: 'AI TVC or OVC', description: 'A full ad film for your brand, no shoot needed.' },
  { value: 'product_photos', title: 'Product photography', description: 'Catalogue, campaign and ecommerce visuals from your product photos.' },
  { value: 'ugc', title: 'UGC content pack', description: 'Many variants every month for Facebook and Instagram, one consistent face.' },
  { value: 'brand_face', title: 'Brand face or mascot', description: 'One character built once and kept across every campaign.' },
  { value: 'unsure', title: 'Not sure yet', description: 'Tell us the problem and we will say what fits.' },
] as const;
function ChipRow({ label, items, value, onChange, columns = 1 }: { label: string; items: { value: string; label: string }[]; value: string; onChange: (value: string) => void; columns?: number }) {
  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role=radio]')];
    const index = buttons.indexOf(event.target as HTMLButtonElement);
    const delta = event.key === 'ArrowUp' ? -columns : event.key === 'ArrowDown' ? columns : event.key === 'ArrowLeft' ? -1 : 1;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + delta + buttons.length) % buttons.length;
    buttons[next]?.focus();
  };
  return <div className={`book-chips ${columns === 3 ? 'book-times' : ''}`} role="radiogroup" aria-label={label} onKeyDown={keyboard}>{items.map((item, i) => <Button key={item.value} type="button" variant="outline" className={`book-chip ${value === item.value ? 'selected' : ''}`} role="radio" aria-checked={value === item.value} tabIndex={value === item.value || (!value && i === 0) ? 0 : -1} onClick={() => onChange(item.value)}>{item.label}</Button>)}</div>;
}
const dateTitle = (day: string) => new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Dhaka' }).format(new Date(`${day}T12:00:00+06:00`));
const clock = (time: string) => { const hour = Number(time.slice(0, 2)); return `${hour % 12 || 12}:${time.slice(3, 5)} ${hour >= 12 ? 'pm' : 'am'}`; };

export function SlotBookingPage() {
  const hydrated = useHydrated();
  const reduce = useMotionPreference();
  const [step, setStep] = useState(1);
  const [serviceChosen, setServiceChosen] = useState(false);
  const [month, setMonth] = useState('');
  const [today, setToday] = useState('');
  const titleRef = useRef<HTMLHeadingElement>(null);
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
  const selectedDay = day;
  const daySlots = groups.find(([key]) => key === selectedDay)?.[1] ?? [];
  const selectedSlot = daySlots.find(slot => slot.slot_at === time);
  const firstMonth = groups[0]?.[0].slice(0, 7) ?? '';
  const displayMonth = month || firstMonth;
  useEffect(() => { setToday(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())); }, []);
  useEffect(() => { if (step > 1) titleRef.current?.focus({ preventScroll: true }); }, [step]);
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
    if (!parsed.success || !selectedSlot || !serviceChosen || submitLock.current) return;
    if (skipSpam(honeypot.current?.value ?? '', mountedAt.current, Date.now())) { setConfirmation(selectedSlot); setEmailSent(true); setStep(5); return; }
    submitLock.current = true; setBusy(true); setError('');
    try {
      const id = await createPublicBooking(selectedSlot.slot_at, parsed.data, source.current);
      setBookingId(id);
      try { await sendBookingLink(parsed.data.email); setEmailSent(true); }
      catch (reason) { setEmailError(reason instanceof Error ? reason.message : 'The email could not be sent.'); }
      setConfirmation(selectedSlot); setStep(5);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Your booking could not be saved. Please try again.';
      if (message.includes('slot_unavailable')) { setError('Someone just took that time. Please pick another available time.'); setTime(''); setStep(3); await slots.refetch(); }
      else if (message.includes('rate_limited')) setError('You already have bookings pending. Please reply to your booking email instead.');
      else setError(message);
    } finally { setBusy(false); submitLock.current = false; }
  };
  const field = (key: 'name' | 'email' | 'whatsapp' | 'brand', label: string, type: string, autoComplete: string) => <div className="booking-field"><label htmlFor={`book-${key}`}>{label}{key === 'brand' ? <span> · optional</span> : <span aria-hidden="true"> *</span>}</label><input id={`book-${key}`} name={key} type={type} autoComplete={autoComplete} value={fields[key]} required={key !== 'brand'} maxLength={key === 'whatsapp' ? 30 : key === 'email' ? 254 : key === 'name' ? 100 : 150} onChange={event => change(key, key === 'whatsapp' ? normalizePhoneInput(event.target.value) : event.target.value)} onBlur={() => setTouched(previous => ({ ...previous, [key]: true }))} aria-invalid={!!(touched[key] && errors[key])} aria-describedby={`book-${key}-error`}/><p className="book-field-error" id={`book-${key}-error`}>{touched[key] ? errors[key] : ''}</p></div>;
  const service = services.find(item => item.value === fields.need);
  const title = step === 1 ? 'What do you need' : step === 2 ? 'Select a date' : step === 3 ? (day ? dateTitle(day) : 'Pick a time') : step === 4 ? 'Your details' : 'You are booked';
  const availability = !hydrated || slots.isPending ? <div className="book-skeleton" aria-label="Loading available dates" role="status"><div className="book-skeleton-times">{Array.from({ length: 21 }, (_, i) => <span key={i} />)}</div></div> : slots.isError ? <div className="book-empty" role="alert"><CalendarDays /><h3>Available times couldn’t load.</h3><p>Please try again in a moment.</p><Button type="button" className="book-chip" onClick={() => void slots.refetch()}><RotateCcw />Retry</Button></div> : !groups.length ? <div className="book-empty"><CalendarDays /><h3>No open times right now.</h3><p>New times will appear when they become available.</p>{whatsapp ? <Button asChild className="book-submit"><a href={whatsapp}><MessageCircle />Chat on WhatsApp</a></Button> : <p>WhatsApp contact is not available yet.</p>}<Button type="button" className="book-chip" onClick={() => void slots.refetch()}>Check again</Button></div> : null;
  return <div className="book-page">
    <aside className="book-portrait"><img src={panel.url} alt="A seated creative professional" /><div className="book-portrait-shade" /><p className="book-display">Let's make the ad<br />your brand<br />actually needs</p></aside>
    <div className="book-right" data-lenis-prevent><div className="book-column">
      <header className="book-heading"><h1>Book a call and tell us<br />what you are selling.</h1><p>Whether you are launching a product, running ads that are not working, or you just need content every month, this call is where we figure out what is actually worth making. Thirty minutes, no charge.</p></header>
      <motion.section className="book-card" layout={!reduce} transition={{ duration: reduce ? 0 : .24 }} aria-busy={busy}>
        <form onSubmit={event => void submit(event)} noValidate><fieldset disabled={busy} className="book-fieldset">
        <AnimatePresence mode="wait" initial={false}><motion.div key={step} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : -8 }} transition={{ duration: reduce ? 0 : .16 }}>
        <div className="book-step-heading">{step > 1 && step < 5 && <Button className="book-back" type="button" variant="ghost" size="icon" aria-label="Back to previous step" title="Back" onClick={() => { setError(''); setStep(step - 1); }}><ArrowLeft /></Button>}{step === 5 && <span className="book-confirmation-icon"><Check /></span>}<h2 ref={titleRef} tabIndex={-1}>{title}</h2></div>
        {step === 1 && <div className="book-services">{services.map(item => <Button type="button" variant="outline" key={item.value} className={`book-service ${serviceChosen && fields.need === item.value ? 'selected' : ''}`} onClick={() => { change('need', item.value); setServiceChosen(true); setError(''); setStep(2); }}><span><strong>{item.title}</strong><span>{item.description}</span><small>30 min · Free</small></span><ArrowRight /></Button>)}</div>}
        {step === 2 && <><p className="book-zone">Dhaka time, GMT+6</p>{availability || <BookingCalendar days={groups.map(([key]) => key)} month={displayMonth} selected={day} today={today} onMonth={setMonth} onSelect={value => { setDay(value); setTime(''); setError(''); setStep(3); }} />}</>}
        {step === 3 && <>{availability || (daySlots.length ? <><ChipRow label="Pick a time" columns={3} items={daySlots.map(slot => ({ value: slot.slot_at, label: clock(slot.local_time) }))} value={time} onChange={value => { setTime(value); setError(''); setStep(4); }} /><p className="book-zone book-time-zone">All times are Asia/Dhaka (GMT+6)</p></> : <div className="book-empty"><p>No times remain on this date.</p><Button type="button" className="book-chip" onClick={() => setStep(2)}>Choose another date</Button></div>)}</>}
        {step === 4 && <><div className="book-summary"><div><strong>{service?.title}</strong><span>{day && dateTitle(day)} · {selectedSlot && clock(selectedSlot.local_time)}</span></div><Button type="button" variant="link" className="book-change" onClick={() => { setError(''); setStep(1); }}>change</Button></div><div className="book-fields">{field('name', 'Your name', 'text', 'name')}{field('whatsapp', 'WhatsApp number', 'tel', 'tel')}{field('email', 'Email', 'email', 'email')}{field('brand', 'Brand or page name', 'text', 'organization')}<div className="booking-field"><label htmlFor="book-message">What is the problem <span>· optional</span></label><textarea id="book-message" name="message" rows={3} maxLength={2000} placeholder="Two lines is enough. What are you selling and what is not working right now." value={fields.message} onChange={event => change('message', event.target.value)} /></div></div><p className="book-budget-label">Budget range</p><ChipRow label="Budget range" items={[...budgets]} value={fields.budget} onChange={value => change('budget', value)} /><Button type="submit" className="book-submit" disabled={busy || !serviceChosen || !selectedSlot || !parsed.success}>{busy ? <><LoaderCircle className="book-spinner" />Confirming…</> : 'Confirm this time'}</Button></>}
        {step === 5 && confirmation && <div className="book-confirmation" role="status"><p className="book-confirmed-service">{service?.title}</p><p>{dayLabel(confirmation.local_day, true)} · {clock(confirmation.local_time)}</p><p className="book-zone">Asia/Dhaka (GMT+6)</p>{emailSent ? <><p>We have emailed you a no-password sign-in link for your booking. Dashboard access and product-photo uploads are coming next.</p><p className="book-small">No email in a minute? Check spam{whatsapp ? ', or message us on WhatsApp.' : '.'}</p>{whatsapp && <a className="book-contact" href={whatsapp}>Message us on WhatsApp</a>}</> : <><p>Your booking is saved, but we couldn’t email your sign-in link.</p><p className="book-error" role="alert">{emailError}</p><Button type="button" className="book-submit" onClick={() => void sendEmail()} disabled={busy}><RotateCcw />{busy ? 'Sending link…' : 'Retry email'}</Button></>}{bookingId && <span className="sr-only">Booking saved</span>}</div>}
        {error && <div className="book-error" role="alert"><p>{error}</p>{!error.includes('Someone just took') && !error.includes('bookings pending') && <Button type="submit" variant="link" className="book-change" disabled={busy || !selectedSlot || !parsed.success}><RotateCcw />Retry</Button>}</div>}
        </motion.div></AnimatePresence><input className="book-honeypot" name="company_website" ref={honeypot} tabIndex={-1} aria-hidden="true" autoComplete="off" />
        </fieldset></form>
      </motion.section>
    </div></div>
  </div>;
}
