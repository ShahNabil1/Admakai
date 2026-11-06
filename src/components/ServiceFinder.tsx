import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, CalendarDays, ChevronDown, ChevronRight, Code2, ListChecks, Mic, Plus, Rocket, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { findPublishedService, publishedServices, servicePriceLine, visibleCategories, type Service } from '@/data/services';
import { useMotionPreference } from '@/hooks/use-motion-preference';
import { appendFinderExchange, createFinderExchange, FINDER_REDIRECT_DELAY, FINDER_REPLY_DELAY, type FinderLanguage, type BrowserSpeechRecognition, type FinderExchange, type SpeechConstructor } from './service-finder-state';
import './service-finder.css';

const AUTO_REDIRECT = false;
const HOOKS = [
  'No camera has ever entered our office. See how we make ads',
  'We delivered a full TVC in three days. See the work',
  'Your next ad starts with one sentence. Type it below',
];
const PLACEHOLDERS = [
  'Ask anything...',
  'e.g. I sell sarees online and need photos on a model',
  'ঈদের অফারের জন্য একটা অ্যাড লাগবে',
  'amar restaurant er jonno reels lagbe',
];
const SUGGESTIONS = [
  { title: 'Sell More Online', subtitle: 'Product photos on a model', icon: ListChecks, tone: 'blue', text: 'I run an online clothing shop and need photos of my products on a model.' },
  { title: 'Launch a Product', subtitle: 'A TV-style ad', icon: Rocket, tone: 'violet', text: 'We are launching a new drink and need a TV-style ad.' },
  { title: 'Explain My Software', subtitle: 'An app demo video', icon: Code2, tone: 'red', text: 'We need a video that shows how our app works.' },
];
const POPULAR_REQUESTS = [
  ['I need photos of my sarees on a model', 'Virtual Try-On'],
  ['Eid offer ad for my Facebook shop', 'Festival Campaign Pack'],
  ['Demo video for our software', 'SaaS Explainer'],
  ['Logo animation for my YouTube intro', 'Motion Ad'],
  ['TV commercial for my juice brand', 'AI Commercial, 30s'],
  ['White background photos for Daraz', 'E-commerce Catalogue'],
  ['Cut my podcast into short clips', 'Long to Short'],
  ['Monthly reels and posts for my page', 'Monthly Subscription'],
];
const POPULAR_LABELS = ['Photos of my sarees on a model', 'Eid offer ad', 'Software demo video', 'Logo animation', 'TV commercial for my juice brand', 'White background photos for Daraz', 'Cut my podcast into short clips', 'Monthly reels and posts for my page'];

function ResultCard({ service, primary, index }: { service: Service; primary: boolean; index: number }) {
  const reduce = useMotionPreference();
  return <motion.article className="service-finder-result" initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : .35, delay: reduce ? 0 : index * .07 }}>
    <h3>{service.name}{service.isNew && <span className="service-finder-new">New</span>}</h3>
    <p>{service.shortDescription}</p>
    <div className="service-finder-result-meta"><span>{service.delivery}</span><strong>{servicePriceLine(service)}</strong></div>
    <Button asChild variant={primary ? 'default' : 'outline'} className="service-finder-open"><Link to="/services/$slug" params={{ slug: service.slug }}>Open {service.name}<ArrowUpRight aria-hidden="true"/></Link></Button>
  </motion.article>;
}

export function ServiceFinder({ onBrowse }: { onBrowse: (category?: string) => void }) {
  const reduce = useMotionPreference();
  const navigate = useNavigate();
  const [hook, setHook] = useState(0);
  const [hookHovered, setHookHovered] = useState(false);
  const [language, setLanguage] = useState<FinderLanguage>('bn-BD');
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const [placeholder, setPlaceholder] = useState(0);
  const [history, setHistory] = useState<FinderExchange[]>([]);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState('');
  const [redirectId, setRedirectId] = useState<number | null>(null);
  const [stayId, setStayId] = useState<number | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const chat = useRef<HTMLDivElement>(null);
  const recognition = useRef<BrowserSpeechRecognition | null>(null);
  const speechConstructor = useRef<SpeechConstructor | null>(null);
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const nextId = useRef(0);

  useEffect(() => {
    // Warm all script subsets at page load, not when a user sends Bengali text.
    for (const weight of [400, 500, 600, 700]) {
      void document.fonts.load(`${weight} 12px "Noto Sans Bengali"`, 'বাংলা English').catch(() => undefined);
    }
    const browser = window as Window & { SpeechRecognition?: SpeechConstructor; webkitSpeechRecognition?: SpeechConstructor };
    speechConstructor.current = browser.SpeechRecognition ?? browser.webkitSpeechRecognition ?? null;
    setSpeechSupported(Boolean(speechConstructor.current));
    return () => {
      if (recognition.current) { recognition.current.onresult = null; recognition.current.abort(); }
      timers.current.forEach(timer => clearTimeout(timer));
    };
  }, []);
  useEffect(() => {
    if (reduce || hookHovered || history.length > 0) return;
    const timer = setInterval(() => setHook(current => (current + 1) % HOOKS.length), 4000);
    return () => clearInterval(timer);
  }, [reduce, hookHovered, history.length]);
  useEffect(() => {
    if (focused || reduce) return;
    const timer = setInterval(() => setPlaceholder(current => (current + 1) % PLACEHOLDERS.length), 3000);
    return () => clearInterval(timer);
  }, [focused, reduce]);
  useEffect(() => {
    const element = textarea.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(112, Math.max(64, element.scrollHeight))}px`;
  }, [input]);
  useEffect(() => {
    const element = chat.current;
    element?.scrollTo({ top: element.scrollHeight, behavior: reduce ? 'instant' : 'smooth' });
  }, [history, reduce]);
  useEffect(() => {
    if (!AUTO_REDIRECT) return;
    const latest = history.at(-1);
    if (!latest?.ready || latest.result.confidence !== 'strong' || !latest.result.best || stayId === latest.id) return;
    const service = findPublishedService(latest.result.best);
    if (!service) return;
    setRedirectId(latest.id);
    const timer = setTimeout(() => void navigate({ to: '/services/$slug', params: { slug: service.slug } }), FINDER_REDIRECT_DELAY);
    return () => { clearTimeout(timer); setRedirectId(null); };
  }, [history, stayId, navigate]);

  const send = (text: string) => {
    if (!text.trim()) return;
    if (recognition.current) { recognition.current.onresult = null; recognition.current.stop(); }
    setListening(false);
    setNotice('');
    setFocused(true);
    setInput('');
    const exchange = createFinderExchange(++nextId.current, text);
    setHistory(current => appendFinderExchange(current, exchange));
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      setHistory(current => current.map(item => item.id === exchange.id ? { ...item, ready: true } : item));
    }, FINDER_REPLY_DELAY);
    timers.current.add(timer);
  };
  const startOver = () => {
    timers.current.forEach(timer => clearTimeout(timer));
    timers.current.clear();
    if (recognition.current) { recognition.current.onresult = null; recognition.current.abort(); }
    setExpanded(false); setHistory([]); setInput(''); setNotice(''); setListening(false); setStayId(null); setRedirectId(null);
  };
  const toggleMic = () => {
    if (listening) { recognition.current?.stop(); return; }
    const Constructor = speechConstructor.current;
    if (!Constructor) return;
    const speech = new Constructor();
    recognition.current = speech;
    speech.lang = language; speech.interimResults = true; speech.continuous = false;
    const prefix = input.trim();
    speech.onresult = event => {
      const transcript = Array.from(event.results).map(result => result[0]?.transcript ?? '').join(' ');
      setInput([prefix, transcript].filter(Boolean).join(' '));
    };
    speech.onerror = event => { setListening(false); setNotice(event.error === 'not-allowed' ? 'Microphone permission was denied. You can type your message instead.' : 'Voice input is unavailable. You can type your message instead.'); };
    speech.onend = () => setListening(false);
    try { speech.start(); setListening(true); setFocused(true); setNotice(''); }
    catch { setListening(false); setNotice('Voice input is unavailable. You can type your message instead.'); }
  };
  const bookButton = <Button asChild variant="ghost" className="service-finder-chip"><Link to="/book"><CalendarDays aria-hidden="true"/>Book a call</Link></Button>;
  const transition = { duration: reduce ? 0 : .22 };
  const focusInput = () => {
    textarea.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'instant' : 'smooth' });
    textarea.current?.focus({ preventScroll: true });
  };
  const hookContent = <><i aria-hidden="true"/><AnimatePresence initial={false} mode="wait"><motion.span key={hook} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition}>{HOOKS[hook]}</motion.span></AnimatePresence><ArrowRight aria-hidden="true"/></>;

  return <section className={`service-finder${history.length > 0 ? ' service-finder-is-chat' : ''}`} aria-label="Service finder">
    <div className="service-finder-inner">
      <div className="service-finder-topbar">
        <nav aria-label="Breadcrumb" className="service-finder-breadcrumb"><Link to="/">Home</Link><ChevronRight aria-hidden="true"/><span aria-current="page">Services</span></nav>
      <div className="service-finder-tabs" role="group" aria-label="Finder views">
        <Button variant="ghost" className="service-finder-tab active" aria-pressed="true" onClick={() => textarea.current?.focus()}>Find a service</Button>
        <Button variant="ghost" className="service-finder-tab" onClick={() => onBrowse()}>Browse all</Button>
        {history.length > 0 && <Button variant="ghost" className="service-finder-start" onClick={startOver}>Start over</Button>}
      </div>
        <div className="service-finder-top-actions"><span className="service-finder-availability"><i aria-hidden="true"/>{publishedServices().length} services available</span>{bookButton}</div>
      </div>
      <div className="service-finder-workspace">
        <AnimatePresence initial={false} mode="wait">
          {history.length === 0 ? <motion.header key="greeting" className="service-finder-greeting" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition}>
            <div className="service-finder-orb" aria-hidden="true"/>
            <Button asChild={hook < 2} variant="ghost" className="service-finder-hook" onMouseEnter={() => setHookHovered(true)} onMouseLeave={() => setHookHovered(false)} onFocus={() => setHookHovered(true)} onBlur={() => setHookHovered(false)} onClick={hook === 2 ? focusInput : undefined}>{hook < 2 ? <Link to="/work">{hookContent}</Link> : hookContent}</Button>
            <h1>WHAT DO YOU WANT TO MAKE?</h1>
            <p className="service-finder-subtext">Tell us in Bangla or English. We will match you to the right service in seconds.</p>
          </motion.header> : <motion.div key="chat" className="service-finder-chat" ref={chat} data-lenis-prevent tabIndex={0} aria-label="Service finder conversation" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition}>
            {history.map(exchange => {
              const { result } = exchange;
              const matches = [result.best, ...result.alternatives].flatMap(slug => { const service = slug ? findPublishedService(slug) : undefined; return service ? [service] : []; });
              const best = matches[0];
              return <div className="service-finder-exchange" key={exchange.id}>
                <p className="service-finder-user">{exchange.text}</p>
                <div className="service-finder-answer"><div className="service-finder-orb service-finder-orb-small" aria-hidden="true"/><div className="service-finder-reply" aria-live="polite" aria-relevant="additions text">
                  {!exchange.ready ? <div className="service-finder-typing" role="status" aria-label="Finding a service"><span/><span/><span/></div> : result.confidence === 'none' || !best ? <>
                    <p>I could not match that yet. Tell me your product and what you want to make, for example: photos of my skincare products, or a video ad for Eid.</p>
                    {bookButton}<div className="service-finder-categories">{visibleCategories().map(category => <Button key={category.id} variant="ghost" className="service-finder-chip" onClick={() => onBrowse(category.id)}>{category.name}</Button>)}</div>
                  </> : result.confidence === 'strong' ? <>
                    <p>This looks like the right fit for you:</p><ResultCard service={best} primary index={0}/>
                    {matches.length > 1 && <div className="service-finder-alternatives"><p>Also worth a look:</p>{matches.slice(1, 3).map(service => <Link className="service-finder-compact" key={service.slug} to="/services/$slug" params={{ slug: service.slug }}>{service.name}<ArrowUpRight aria-hidden="true"/></Link>)}</div>}
                    {redirectId === exchange.id && <p className="service-finder-notice">Taking you there in 3 seconds <Button variant="link" onClick={() => setStayId(exchange.id)}>Stay here</Button></p>}
                  </> : <>
                    <p>Here are the closest matches. Pick the one that fits best:</p>{matches.slice(0, 3).map((service, index) => <ResultCard key={service.slug} service={service} primary={false} index={index}/>)}
                    <div className="service-finder-help"><p>Still not sure? Book a call and we will help you choose.</p>{bookButton}</div>
                  </>}
                </div></div>
              </div>;
            })}
          </motion.div>}
        </AnimatePresence>
        <form className="service-finder-composer" onSubmit={event => { event.preventDefault(); send(input); }}>
          <textarea className="service-finder-input" ref={textarea} rows={2} aria-label="Describe your product or goal" placeholder={PLACEHOLDERS[placeholder]} value={input} onChange={event => setInput(event.target.value)} onFocus={() => setFocused(true)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(input); } }}/>
          <div className="service-finder-actions">
            <div className="service-finder-links">
              <Button type="button" variant="ghost" size="icon" className="service-finder-plus" aria-label="Browse all services" title="Browse all services" onClick={() => onBrowse()}><Plus aria-hidden="true"/></Button>
              <DropdownMenu><DropdownMenuTrigger asChild><Button type="button" variant="ghost" className="service-finder-chip" aria-label="Voice input language">Language<ChevronDown aria-hidden="true"/></Button></DropdownMenuTrigger><DropdownMenuContent className="service-finder-language-menu" align="start"><DropdownMenuRadioGroup value={language} onValueChange={value => { if (value !== 'bn-BD' && value !== 'en-US') return; if (recognition.current) { recognition.current.onresult = null; recognition.current.abort(); } setListening(false); setLanguage(value); }}><DropdownMenuRadioItem value="bn-BD">বাংলা</DropdownMenuRadioItem><DropdownMenuRadioItem value="en-US">English</DropdownMenuRadioItem></DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu>
              {bookButton}
            </div>
            <div className="service-finder-tools">
              {speechSupported && <Button type="button" variant="ghost" className="service-finder-chip service-finder-mic" aria-label={listening ? 'Stop voice input' : 'Start voice input'} aria-pressed={listening} title={listening ? 'Stop voice input' : 'Start voice input. Your browser may send audio to its speech recognition provider.'} onClick={toggleMic}>{listening ? <span className="service-finder-wave" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/></span> : <Mic aria-hidden="true"/>}<span>{listening ? 'Listening' : 'Voice'}</span></Button>}
              <Button type="submit" size="icon" className="service-finder-send" aria-label="Send message" title="Send message" disabled={!input.trim()}><Send aria-hidden="true"/></Button>
            </div>
          </div>
          {notice && <p className="service-finder-notice" role="status">{notice}</p>}
        </form>
        <AnimatePresence initial={false}>
          {history.length === 0 && <motion.div className="service-finder-discovery" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition}>
            <div className="service-finder-suggestions">{SUGGESTIONS.map(suggestion => <Button key={suggestion.title} variant="ghost" className="service-finder-suggestion" onClick={() => send(suggestion.text)}><span className="service-finder-suggestion-heading"><span className={`service-finder-icon service-finder-icon-${suggestion.tone}`}><suggestion.icon aria-hidden="true"/></span><strong>{suggestion.title}</strong></span><span className="service-finder-suggestion-bottom">{suggestion.subtitle}<ArrowRight aria-hidden="true"/></span></Button>)}</div>
            <div className="service-finder-popular"><h2>Popular:</h2>{POPULAR_REQUESTS.slice(0, expanded ? 8 : 4).map(([question], index) => <Button key={question} variant="ghost" className="service-finder-request" onClick={() => { if (question) send(question); }}>{POPULAR_LABELS[index]}</Button>)}<Button variant="ghost" className="service-finder-see-more" aria-expanded={expanded} onClick={() => setExpanded(current => !current)}>{expanded ? 'Less' : 'More'}<ChevronDown aria-hidden="true"/></Button></div>
          </motion.div>}
        </AnimatePresence>
      </div>
    </div>
  </section>;
}
