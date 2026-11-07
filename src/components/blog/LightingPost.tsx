import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { DISCORD_URL, WHATSAPP_GROUP_URL } from '@/data/blog';
import { lightingStyles, moodFinder, styleCategories, glossary, buildPrompt, MASTER_TEMPLATE, type LightingStyle } from '@/data/lightingStyles';
import './lighting-guide.css';

const readyStyles = lightingStyles.filter(s => !s.pending);

function Fade({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setInView(true); io.disconnect(); } }, { rootMargin: '0px 0px -12% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`lg-fade${inView ? ' in' : ''}${className ? ` ${className}` : ''}`}>{children}</div>;
}

function LightSwatch({ swatch }: { swatch: LightingStyle['swatch'] }) {
  return (
    <div className="lg-swatch" style={{ background: `radial-gradient(90% 90% at ${swatch.x}% ${swatch.y}%, ${swatch.key} 0%, ${swatch.bg} 58%)` }} aria-hidden="true">
      <div className="lg-swatch-head" />
    </div>
  );
}

function CommunityButtons() {
  return (
    <div className="lg-community-btns">
      <a className="lg-btn discord" href={DISCORD_URL} target="_blank" rel="noopener noreferrer">Discord এ যোগ দিন</a>
      <a className="lg-btn whatsapp" href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer">WhatsApp কমিউনিটিতে যোগ দিন</a>
    </div>
  );
}

function PromptBox({ style, onCopy }: { style: LightingStyle; onCopy: (text: string, message: string) => void }) {
  const [open, setOpen] = useState(false);
  const full = buildPrompt(style);
  return (
    <>
      <div className="lg-codebox">
        <div className="lg-codebox-bar">
          <span>Prompt · {style.nameEn}</span>
          <button type="button" className="lg-copy" onClick={() => onCopy(full, 'প্রম্পট কপি হয়েছে')}>কপি করুন</button>
        </div>
        <pre className={open ? '' : 'lg-clamped'}>{full}</pre>
        {!open && <button type="button" className="lg-more" onClick={() => setOpen(true)}>পুরো প্রম্পট দেখুন</button>}
      </div>
      <button type="button" className="lg-ref-link" onClick={() => onCopy(buildPrompt(style, true), 'প্রম্পট কপি হয়েছে')}>রেফারেন্স ছবিসহ ভার্সন কপি করুন</button>
    </>
  );
}

function StyleCard({ style, index, onCopy, onJump }: { style: LightingStyle; index: number; onCopy: (text: string, message: string) => void; onJump: (id: string) => void }) {
  const prev = readyStyles[index - 1];
  const next = readyStyles[index + 1];
  return (
    <Fade className="lg-style" key={style.id}>
      <div id={`lg-style-${style.id}`} style={{ scrollMarginTop: 104 }}>
        <div className="lg-style-head">
          <span className="lg-num">{String(style.id).padStart(2, '0')}</span>
          <h3>{style.nameEn}</h3>
          <span className="lg-bn">{style.nameBn}</span>
        </div>
        <div className="lg-tags"><span className="lg-tag">{style.category}</span><span className="lg-tag">{style.mood}</span></div>
        <LightSwatch swatch={style.swatch} />
        <h4>এটা কী</h4>
        <p>{style.what}</p>
        <h4>কখন ব্যবহার করবেন</h4>
        <p>{style.when}</p>
        <div className="lg-specs">
          <span className="lg-spec">আলোর দিক: <b>{style.specs.direction}</b></span>
          <span className="lg-spec">কনট্রাস্ট: <b>{style.specs.contrast}</b></span>
          <span className="lg-spec">কালার টেম্পারেচার: <b>{style.specs.temperature}</b></span>
          <span className="lg-spec">আলোর ধরন: <b>{style.specs.quality}</b></span>
        </div>
        <div className="lg-tip"><b>প্রো টিপ:</b> {style.tip}</div>
        <PromptBox style={style} onCopy={onCopy} />
        <div className="lg-prevnext">
          {prev ? <button type="button" onClick={() => onJump(`lg-style-${prev.id}`)}>← {prev.nameEn}</button> : <span />}
          {next ? <button type="button" onClick={() => onJump(`lg-style-${next.id}`)}>{next.nameEn} →</button> : <span />}
        </div>
      </div>
    </Fade>
  );
}

const tocBase = [
  { id: 'lg-intro', label: 'কেন আলোই আসল খেলা' },
  { id: 'lg-howto', label: 'কীভাবে ব্যবহার করবেন' },
  { id: 'lg-rules', label: 'ভালো রেজাল্টের নিয়ম' },
  { id: 'lg-template', label: 'মাস্টার প্রম্পট' },
  { id: 'lg-finder', label: 'মুড ফাইন্ডার' },
  { id: 'lg-grid', label: '৩৪টি স্টাইল এক নজরে' },
];
const tocEnd = [{ id: 'lg-glossary', label: 'শব্দগুলো সহজ ভাষায়' }];

export function LightingPost() {
  const [toast, setToast] = useState('');
  const [activeSection, setActiveSection] = useState('lg-intro');
  const [category, setCategory] = useState('সব');
  const [mood, setMood] = useState('');
  const [tocOpen, setTocOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinVisible, setJoinVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const finalRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2000);
  }, []);

  const copy = useCallback(async (text: string, message: string) => {
    try { await navigator.clipboard.writeText(text); showToast(message); }
    catch { showToast('কপি করা যায়নি, প্রম্পটটা সিলেক্ট করে কপি করুন'); }
  }, [showToast]);

  const share = useCallback(async () => {
    try { await navigator.clipboard.writeText(window.location.href); showToast('কপি হয়েছে'); }
    catch { showToast('লিংক কপি করা যায়নি'); }
  }, [showToast]);

  const jump = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTocOpen(false);
  }, []);

  // Scrollspy
  useEffect(() => {
    const ids = [...tocBase, ...readyStyles.map(s => ({ id: `lg-style-${s.id}` })), ...tocEnd].map(t => t.id);
    const els = ids.map(id => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!els.length || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActiveSection(entry.target.id);
    }, { rootMargin: '-20% 0px -70% 0px' });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Floating join pill: show after hero, hide while final CTA is visible
  useEffect(() => {
    const hero = heroRef.current, fin = finalRef.current;
    if (!hero || !fin || typeof IntersectionObserver === 'undefined') return;
    let pastHero = false, ctaVisible = false;
    const update = () => setJoinVisible(pastHero && !ctaVisible);
    const ioHero = new IntersectionObserver(([e]) => { pastHero = !e?.isIntersecting; update(); }, { rootMargin: '-88px 0px 0px 0px' });
    const ioCta = new IntersectionObserver(([e]) => { ctaVisible = !!e?.isIntersecting; update(); });
    ioHero.observe(hero); ioCta.observe(fin);
    return () => { ioHero.disconnect(); ioCta.disconnect(); };
  }, []);

  const pickMood = (name: string) => {
    setMood(prev => prev === name ? '' : name);
    document.getElementById('lg-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const moodIds = mood ? new Set(moodFinder.find(m => m.mood === mood)?.ids ?? []) : null;
  const visibleStyles = lightingStyles.filter(s => category === 'সব' || s.category === category);
  const tocItems = [...tocBase, ...readyStyles.map(s => ({ id: `lg-style-${s.id}`, label: `${s.id}. ${s.nameEn}` })), ...tocEnd];

  const tocNav = (
    <nav className="lg-toc" aria-label="সূচিপত্র">
      <h4>সূচিপত্র</h4>
      {tocItems.map(item => (
        <a key={item.id} href={`#${item.id}`} className={activeSection === item.id ? 'active' : ''} onClick={e => { e.preventDefault(); jump(item.id); }}>{item.label}</a>
      ))}
    </nav>
  );

  return (
    <div className="lg-page">
      <article className="lg-inner">
        <div className="lg-col">
          <nav aria-label="Breadcrumb" className="lg-crumb"><Link to="/blog">ব্লগ</Link> / ভিডিও লাইটিং গাইড</nav>

          <header className="lg-head">
            <p className="lg-meta">৭ নভেম্বর ২০২৬ · ১২ মিনিট পড়া · AI Video</p>
            <h1>একই ভিডিও, ৩৪ রকম আলো: শুটিং ছাড়াই AI দিয়ে সিনেমাটিক লাইটিংয়ের পূর্ণ গাইড</h1>
            <p className="lg-sub">নিজের তোলা ভিডিওর আলো বদলে দিন একটা প্রম্পটে। প্রতিটা স্টাইলের মানে, কখন ব্যবহার করবেন, কোন ভুলটা এড়াবেন, আর কপি করার মতো রেডি প্রম্পট।</p>
            <div className="lg-author">
              <span className="lg-avatar" aria-hidden="true">A</span>
              <span className="lg-author-name">Admakai</span>
              <button type="button" className="lg-share" onClick={share}>শেয়ার করুন</button>
            </div>
          </header>

          <div className="lg-hero-visual" ref={heroRef} role="img" aria-label="একটা মাথার চারপাশে ঘুরতে থাকা আলোর বিম, যা আলোর দিক বদলানো দেখায়">
            <div className="lg-hero-glow" />
            <div className="lg-hero-beam" />
            <div className="lg-hero-head" />
            <span className="lg-hero-tag front">Front</span>
            <span className="lg-hero-tag side">Side</span>
            <span className="lg-hero-tag back">Back</span>
            <span className="lg-hero-tag top">Top</span>
            <span className="lg-hero-tag under">Under</span>
          </div>

          <div className="lg-community">
            <p>প্রতিদিনের নতুন প্রম্পট, রিভিউ আর প্রশ্নের উত্তর পেতে আমাদের কমিউনিটিতে আসুন।</p>
            <CommunityButtons />
          </div>
        </div>

        <div className="lg-layout">
          <div className="lg-col" style={{ margin: 0, maxWidth: 'none' }}>
            <Fade>
              <section id="lg-intro" style={{ scrollMarginTop: 104 }}>
                <h2>কেন আলোই আসল খেলা</h2>
                <p>একই মানুষ, একই ঘর, একই সংলাপ। শুধু আলো বদলালে দৃশ্যটা কখনো হয়ে যায় বিজ্ঞাপন, কখনো থ্রিলার, কখনো পুরনো দিনের তৈলচিত্র। সিনেমায় এই কাজের জন্য লাইট, গ্রিপ আর পুরো একটা টিম লাগে। এখন AI ভিডিও টুলে নিজের তোলা ক্লিপ দিয়ে, সঠিক প্রম্পট লিখে, একই কাজ করা যায়।</p>
                <p>এই গাইডে ৩৪টি লাইটিং স্টাইল আছে। প্রতিটার সাথে আছে স্টাইলটা আসলে কী, কোন ধরনের কাজে মানায়, আলোর দিক, কনট্রাস্ট আর কালার টেম্পারেচার, একটা প্রো টিপ, আর একটা প্রম্পট যেটা কপি করে সরাসরি ব্যবহার করতে পারবেন।</p>
              </section>
            </Fade>

            <Fade>
              <section id="lg-howto" style={{ scrollMarginTop: 104 }}>
                <h2>কীভাবে ব্যবহার করবেন</h2>
                <div className="lg-steps">
                  <div className="lg-step-card">
                    <span className="lg-num" aria-hidden="true">১</span>
                    <h3>ভিডিও রেকর্ড করুন</h3>
                    <p>যে পারফরম্যান্স দরকার সেটা অরিজিনাল অডিওসহ শুট করুন। ৫ থেকে ১০ সেকেন্ডের ছোট ক্লিপে রেজাল্ট সবচেয়ে ভালো আসে।</p>
                  </div>
                  <div className="lg-step-card">
                    <span className="lg-num" aria-hidden="true">২</span>
                    <h3>লাইটিং বেছে নিন</h3>
                    <p>নিচের মুড ফাইন্ডার বা ৩৪টি স্টাইলের গ্রিড থেকে আপনার দৃশ্যের মুড অনুযায়ী একটা বেছে নিয়ে প্রম্পট কপি করুন।</p>
                  </div>
                  <div className="lg-step-card">
                    <span className="lg-num" aria-hidden="true">৩</span>
                    <h3>জেনারেট করুন</h3>
                    <p>আপনার AI ভিডিও টুলে ক্লিপ আপলোড করে @video1 হিসেবে ট্যাগ করুন, প্রম্পট পেস্ট করুন, আর আউটপুটের দৈর্ঘ্য অরিজিনাল ক্লিপের সমান রাখুন।</p>
                  </div>
                </div>
                <div className="lg-note">আপনার টুলে ট্যাগের নিয়ম আলাদা হলে, যেমন @img-1 বা @Video 1, প্রম্পটের @video1 আর @image1 শুধু বদলে নিন, বাকি সব একই থাকবে।</div>
              </section>
            </Fade>

            <Fade>
              <section id="lg-rules" style={{ scrollMarginTop: 104 }}>
                <h2>ভালো রেজাল্টের নিয়ম</h2>
                <ul className="lg-rules">
                  <li>একবারে একটাই লাইটিং স্টাইল দিন। দুইটা মেশালে AI দুটোর কোনোটাই ঠিকমতো করে না।</li>
                  <li>সোর্স ভিডিওর এক্সপোজার স্থির রাখুন। অটো এক্সপোজারে মিটমিট করা ক্লিপ রিলাইট করলে ফ্লিকার আরও বাড়ে।</li>
                  <li>মুখ পরিষ্কার দেখা যায় এমন শট বেছে নিন। মুখ খুব ছোট বা ঝাপসা হলে Rembrandt বা Loop এর মতো সূক্ষ্ম স্টাইল ধরা পড়ে না।</li>
                  <li>রেফারেন্স ছবি দিলে স্পষ্ট লিখুন যে সেটা শুধু আলো আর রঙের জন্য। নাহলে AI ছবির মানুষ বা লোকেশন কপি করে ফেলে।</li>
                  <li>প্রথম রেজাল্ট পছন্দ না হলে পুরো প্রম্পট বদলাবেন না। শুধু LIGHT লাইনের একটা শব্দ বদলান, যেমন soft থেকে hard, তাহলে বুঝবেন কোন পরিবর্তনে কী হয়।</li>
                </ul>
              </section>
            </Fade>

            <Fade>
              <section id="lg-template" style={{ scrollMarginTop: 104 }}>
                <h2>মাস্টার প্রম্পট কীভাবে কাজ করে</h2>
                <p>প্রতিটা প্রম্পট চারটা ব্লকে ভাগ করা। LOCK ব্লক আপনার শট অক্ষত রাখে, LIGHT আর COLOUR ব্লক আলো বদলায়, CONSISTENCY ব্লক পুরো ক্লিপ জুড়ে আলো স্থির রাখে, আর FINISH ব্লক রেজাল্ট বাস্তব রাখে। প্রতিটা স্টাইলে শুধু LIGHT আর COLOUR বদলায়।</p>
                <div className="lg-codebox">
                  <div className="lg-codebox-bar">
                    <span>Master template</span>
                    <button type="button" className="lg-copy" onClick={() => copy(MASTER_TEMPLATE, 'প্রম্পট কপি হয়েছে')}>কপি করুন</button>
                  </div>
                  <pre>{MASTER_TEMPLATE}</pre>
                </div>
              </section>
            </Fade>

            <Fade>
              <section id="lg-finder" style={{ scrollMarginTop: 104 }}>
                <h2>কোন মুডের জন্য কোন আলো</h2>
                <div className="lg-moods">
                  {moodFinder.map(m => (
                    <button key={m.mood} type="button" className={`lg-mood${mood === m.mood ? ' active' : ''}`} onClick={() => pickMood(m.mood)}>{m.mood}</button>
                  ))}
                </div>
              </section>
            </Fade>

            <Fade>
              <section id="lg-grid" style={{ scrollMarginTop: 104 }}>
                <h2>৩৪টি স্টাইল এক নজরে</h2>
                <div className="lg-cats">
                  {styleCategories.map(c => (
                    <button key={c} type="button" className={`lg-cat${category === c ? ' active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
                  ))}
                </div>
                <div className="lg-grid">
                  {visibleStyles.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      className={`lg-tile${moodIds ? (moodIds.has(s.id) ? ' lg-hit' : ' lg-dim') : ''}`}
                      onClick={() => !s.pending && jump(`lg-style-${s.id}`)}
                      disabled={s.pending}
                    >
                      <LightSwatch swatch={s.swatch} />
                      <div className="lg-tile-body">
                        <span className="lg-num">{String(s.id).padStart(2, '0')}</span>
                        <b>{s.pending ? 'শীঘ্রই আসছে' : s.nameEn}</b>
                        <span>{s.pending ? '' : s.nameBn}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </Fade>

            {readyStyles.map((s, i) => (
              <div key={s.id}>
                <StyleCard style={s} index={i} onCopy={copy} onJump={jump} />
                {(s.id === 12 || s.id === 24) && (
                  <Fade className="lg-banner">
                    <h3>প্রম্পট দিয়ে আটকে গেছেন?</h3>
                    <p>আপনার রেজাল্ট কমিউনিটিতে শেয়ার করুন, আমরা দেখে বলে দেব কোন লাইনটা বদলালে ঠিক হবে।</p>
                    <CommunityButtons />
                  </Fade>
                )}
              </div>
            ))}

            <Fade>
              <section id="lg-glossary" style={{ scrollMarginTop: 104 }}>
                <h2>শব্দগুলো সহজ ভাষায়</h2>
                <div className="lg-gloss">
                  {glossary.map(g => (
                    <details key={g.term}>
                      <summary>{g.term}</summary>
                      <p>{g.meaning}</p>
                    </details>
                  ))}
                </div>
              </section>
            </Fade>

            <Fade>
              <div className="lg-final" ref={finalRef}>
                <h2>পরের ধাপে কী শিখবেন, ঠিক করুন কমিউনিটিতে</h2>
                <p>প্রতি সপ্তাহে নতুন প্রম্পট প্যাক, লাইভ রিভিউ আর AI ভিডিওর খুঁটিনাটি নিয়ে আলোচনা হয় আমাদের Discord আর WhatsApp কমিউনিটিতে। যোগ দেওয়া একদম ফ্রি।</p>
                <CommunityButtons />
              </div>
            </Fade>
          </div>

          {tocNav}
        </div>
      </article>

      <button type="button" className="lg-toc-sheet-btn" onClick={() => setTocOpen(o => !o)}>সূচিপত্র</button>
      {tocOpen && <div className="lg-toc lg-toc-sheet">{tocNav}</div>}

      <button type="button" className={`lg-join${joinVisible ? '' : ' hidden'}`} onClick={() => setJoinOpen(o => !o)}>কমিউনিটিতে যোগ দিন</button>
      {joinOpen && joinVisible && (
        <div className="lg-join-pop">
          <a className="lg-btn discord" href={DISCORD_URL} target="_blank" rel="noopener noreferrer">Discord এ যোগ দিন</a>
          <a className="lg-btn whatsapp" href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer">WhatsApp কমিউনিটিতে যোগ দিন</a>
        </div>
      )}

      {toast && <div className="lg-toast" role="status">{toast}</div>}
    </div>
  );
}
