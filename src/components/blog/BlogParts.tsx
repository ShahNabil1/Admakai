import { useEffect, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent, type KeyboardEvent } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useMotionPreference } from '@/hooks/use-motion-preference';
import './blog.css';

const ease = [0.16, 1, 0.3, 1] as const;
const fileName = (src: string) => src.split('/').pop() ?? src;

/** Image that swaps to a neutral grey placeholder naming the file when it fails to load. */
export function SafeImg({ src, alt, ratio = "16 / 9", className }: { src: string; alt: string; ratio?: string | undefined; className?: string | undefined }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => { const img = ref.current; if (img && img.complete && img.naturalWidth === 0) setFailed(true); }, [src]);
  if (failed) return <div className={`blog-missing ${className ?? ''}`} style={{ aspectRatio: ratio }} role="img" aria-label={alt}><span>{fileName(src)}</span></div>;
  return <img ref={ref} src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className={className} style={{ aspectRatio: ratio }} />;
}

export function Section({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useMotionPreference();
  if (reduce) return <section className={className}>{children}</section>;
  return <motion.section className={className} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -15% 0px' }} transition={{ duration: 0.5, ease }}>{children}</motion.section>;
}

export function ReadingProgress() {
  const reduce = useMotionPreference();
  const { scrollYProgress } = useScroll();
  if (reduce) return null;
  return <motion.div className="blog-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />;
}

export function Cover({ src, alt }: { src: string; alt: string }) {
  const reduce = useMotionPreference();
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 400], [1.04, 1]);
  return <div className="blog-wide-cover blog-frame"><motion.div style={reduce ? {} : { scale }}><SafeImg src={src} alt={alt} ratio="16 / 9" /></motion.div></div>;
}

export function Figure({ src, caption, ratio }: { src: string; caption: string; ratio?: string | undefined }) {
  return <figure className="blog-figure"><div className="blog-frame"><SafeImg src={src} alt={caption} ratio={ratio} /></div><figcaption>{caption}</figcaption></figure>;
}

export function Gallery({ cols, items, ratio = '4 / 3' }: { cols: 2 | 3; items: { src: string; caption: string }[]; ratio?: string }) {
  const reduce = useMotionPreference();
  return (
    <motion.div className={`blog-wide blog-gallery cols-${cols}`} initial={reduce ? false : 'hidden'} whileInView="show" viewport={{ once: true, margin: '0px 0px -15% 0px' }} transition={{ staggerChildren: 0.06 }}>
      {items.map(item => (
        <motion.div key={item.src} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }}>
          <Figure src={item.src} caption={item.caption} ratio={ratio} />
        </motion.div>
      ))}
    </motion.div>
  );
}

export function Compare({ before, after }: { before: { src: string; label: string }; after: { src: string; label: string } }) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const update = (clientX: number) => { const r = ref.current?.getBoundingClientRect(); if (r) setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100))); };
  const down = (e: ReactPointerEvent<HTMLDivElement>) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); update(e.clientX); };
  const move = (e: ReactPointerEvent<HTMLDivElement>) => { if (dragging.current) update(e.clientX); };
  const up = () => { dragging.current = false; };
  const key = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') setPos(p => Math.max(0, p - 5)); if (e.key === 'ArrowRight') setPos(p => Math.min(100, p + 5)); };
  return (
    <div className="blog-wide">
      <div ref={ref} className="blog-compare blog-frame" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <SafeImg src={after.src} alt={after.label} />
        <div className="blog-compare-before" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}><SafeImg src={before.src} alt={before.label} /></div>
        <div className="blog-compare-handle" style={{ left: `${pos}%` }} role="slider" tabIndex={0} aria-label="আগে আর পরে তুলনা" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pos)} onKeyDown={key}><span /></div>
        <span className="blog-pill left">{before.label}</span>
        <span className="blog-pill right">{after.label}</span>
      </div>
    </div>
  );
}

export function Prompt({ label, text }: { label: string; text: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const pre = useRef<HTMLPreElement>(null);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { const el = pre.current; if (!el) return; setOpen(true); const range = document.createRange(); range.selectNodeContents(el); const sel = window.getSelection(); sel?.removeAllRanges(); sel?.addRange(range); }
  };
  return (
    <div className="blog-prompt blog-frame">
      <div className="blog-prompt-bar"><span className="blog-caps">{label}</span><button type="button" onClick={copy}>{copied ? 'কপি হয়েছে' : 'কপি করুন'}</button></div>
      <pre ref={pre} className={open ? 'is-open' : ''}>{text}</pre>
      {!open && <button type="button" className="blog-prompt-more" onClick={() => setOpen(true)}>পুরোটা দেখুন</button>}
    </div>
  );
}

export const Note = ({ children }: { children: ReactNode }) => <div className="blog-note">{children}</div>;
export const Soft = ({ children }: { children: ReactNode }) => <div className="blog-soft">{children}</div>;

export function PillLink({ href, children, variant }: { href: string; children: ReactNode; variant?: 'discord' | 'whatsapp' }) {
  return <a className={`blog-btn ${variant ?? ''}`} href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}

export function CtaStrip({ text, button, href, variant = 'discord' }: { text: string; button: string; href: string; variant?: 'discord' | 'whatsapp' }) {
  return (
    <div className="blog-cta">
      <p>{text}</p>
      <div className="blog-cta-action"><PillLink href={href} variant={variant}>{button} →</PillLink><span className="blog-url">{href.replace(/^https:\/\//, '')}</span></div>
    </div>
  );
}

export function Step({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <Section className="blog-step">
      <span className="blog-step-num" aria-hidden="true">{n}</span>
      <h3><span className="sr-only">ধাপ {n}, </span>{title}</h3>
      {children}
    </Section>
  );
}
