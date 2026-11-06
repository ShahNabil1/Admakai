import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Facebook, Instagram, Linkedin, Youtube, Music2, MessageCircle } from "lucide-react";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { gsap, registerGsap } from "@/lib/gsap";
import { siteQueryOptions } from "@/lib/site-query";
import landscape from "@/assets/footer/footer-bg.jpg.asset.json";
import logo from "@/assets/brand/logo-dark-cropped.png.asset.json";
import "./footer.css";

const columns = [
  { label: "Services", links: [["AI Commercials", "/services/ai-commercial-30s"], ["AI UGC Ads", "/services/ai-ugc-ads"], ["Product Photoshoot", "/services/ai-product-photoshoot"], ["Brand Models and Clones", "/services/ai-brand-model"], ["Voice and Dubbing", "/services/ai-voiceover"], ["All services", "/services"]] },
  { label: "Work", links: [["Portfolio", "/work"], ["Case studies", "/work"], ["Formats", "/#formats"], ["Pricing", "/pricing"]] },
  { label: "Company", links: [["About", "/about"], ["Our AI policy", "/about#ai-policy"], ["Book a call", "/book"]] },
  { label: "Legal", links: [["Privacy policy", "/privacy"], ["Terms", "/terms"], ["Refund policy", "/refund"], ["AI disclosure", "/about#ai-policy"]] },
];
const socialIcons = { facebook: Facebook, instagram: Instagram, linkedin: Linkedin, youtube: Youtube, tiktok: Music2 };

export function Footer() {
  const { data: { site, year } } = useSuspenseQuery(siteQueryOptions);
  const reduce = useMotionPreference();
  const scene = useRef<HTMLDivElement>(null);
  const wordmark = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!scene.current || !wordmark.current || !text.current) return;
    const fit = () => {
      if (!scene.current || !text.current) return;
      text.current.style.fontSize = `${Math.min(360, Math.max(120, scene.current.clientWidth * 0.19))}px`;
      const width = text.current.getBoundingClientRect().width;
      // Measure the actual glyph run, not the block width.
      const range = document.createRange(); range.selectNodeContents(text.current);
      const glyphWidth = range.getBoundingClientRect().width;
      if (glyphWidth > width * .94) text.current.style.fontSize = `${parseFloat(text.current.style.fontSize) * width * .94 / glyphWidth}px`;
    };
    fit(); const observer = new ResizeObserver(fit); observer.observe(scene.current);
    if (reduce || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => observer.disconnect();
    registerGsap();
    const context = gsap.context(() => gsap.fromTo(wordmark.current, { y: -30 }, { y: 30, ease: "none", scrollTrigger: { trigger: scene.current, start: "top bottom", end: "bottom top", scrub: true } }), scene.current);
    return () => { observer.disconnect(); context.revert(); };
  }, [reduce]);
  return <footer className="site-footer">
    <div className="container-site footer-top">
      <div className="footer-grid">
        <div><Link to="/" aria-label="Admakai home"><img src={logo.url} className="footer-logo" loading="lazy" alt="Admakai" width="198" height="40" /></Link>
          <p className="footer-tagline">{site.TAGLINE}</p>
          <div className="footer-socials">
            {(Object.keys(socialIcons) as (keyof typeof socialIcons)[]).map(name => { const Icon = socialIcons[name]; return site.SOCIALS[name] ? <a className="footer-social" key={name} href={site.SOCIALS[name]} aria-label={name} target="_blank" rel="noopener noreferrer"><Icon /></a> : null; })}
            {site.WHATSAPP && <a className="footer-social" href={`https://wa.me/${site.WHATSAPP}`} rel="noopener" aria-label="WhatsApp"><MessageCircle /></a>}
          </div>
        </div>
        <div className="footer-columns">{columns.map(column => <nav className="footer-column" key={column.label} aria-label={`Footer ${column.label}`}><h2>{column.label}</h2><ul>
          {column.links.map(([label, href]) => <li key={label}><a className="footer-link" href={href}>{label}</a></li>)}
          {column.label === "Company" && <>{site.WHATSAPP && <li><a className="footer-link" href={`https://wa.me/${site.WHATSAPP}`} rel="noopener">WhatsApp</a></li>}{site.EMAIL && <li><a className="footer-link" href={`mailto:${site.EMAIL}`} rel="noopener">Email</a></li>}</>}
        </ul></nav>)}</div>
      </div>
      <p className="footer-copyright">© {year} {site.LEGAL_NAME}.{site.ADDRESS && <>{" "}<span>{site.ADDRESS}</span></>}</p>
    </div>
    <div className="footer-landscape" ref={scene}>
      <img className="footer-landscape-image" src={landscape.url} alt="" loading="lazy" width="1280" height="720" />
      <div className="footer-wordmark-parallax" ref={wordmark}><motion.span ref={text} className="footer-wordmark" aria-hidden="true" initial={reduce ? false : { opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: reduce ? 0 : 1, ease: [0.22, 1, 0.36, 1] }}>admakai</motion.span></div>
      <img className="footer-landscape-image footer-foreground" src={landscape.url} alt="" aria-hidden="true" loading="lazy" width="1280" height="720" />
    </div>
  </footer>;
}
