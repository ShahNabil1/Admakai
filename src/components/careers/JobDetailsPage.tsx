import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, BadgeCheck, Bookmark, BookmarkCheck, Check, Link2, MapPin, Play, Video } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { useAuth } from "@/lib/auth-state";
import { careerDetailOptions, careerJobsOptions, internshipVideoOptions } from "@/lib/careers-query";
import { canApply } from "@/lib/careers-rules";
import type { CareerJob } from "@/lib/careers.functions";
import { resolveInternshipVideo, showInternshipVideo, youtubePoster } from "@/lib/internship-video";
import { jobChips, jobFaqs, jobTypeLabel, postedLabel, seatsLine, workModeLabel } from "@/lib/job-page-rules";
import { listSavedJobs, setSavedJob } from "@/lib/saved-jobs.functions";
import { useHiringMedia } from "@/hooks/use-hiring-media";
import { team, teamInitials } from "@/data/team";
import { InternshipVideo } from "./InternshipVideo";
import { HiringRichText } from "./HiringRichText";
import { CareerUnavailable, DraftBanner } from "./CareerShared";
import { useCareersIdentity } from "./useCareersIdentity";
import "./job-details.css";

const PENDING_SAVE = "admakai-pending-saved-job";
const MONTHS = [
  { months: "Months 1 to 2", title: "Learn the craft", tag: "Live sessions", line: "Live sessions with the team, practice briefs, and feedback on everything you make." },
  { months: "Months 3 to 4", title: "Real projects", tag: "Brand work", line: "You join brand projects next to our senior artists." },
  { months: "Months 5 to 6", title: "Own your work", tag: "Core team", line: "You lead parts of projects, and the strongest people join our core team." },
] as const;
const BRANDS = ["SkinO", "innsaei", "Gentle Park"];

/** Staggered fade-up on scroll; static when the visitor prefers reduced motion. */
function Rise({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useMotionPreference();
  if (reduce !== false) return <div className={className}>{children}</div>;
  return <motion.div className={className} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}

function ApplyButton({ job, existing, className = "", label = "Apply now" }: { job: CareerJob; existing: boolean; className?: string; label?: string }) {
  if (existing) return <Link to="/dashboard/careers" className={`jd-apply ${className}`}>View application <ArrowUpRight size={16} /></Link>;
  if (!canApply(job)) return <span className={`jd-apply is-closed ${className}`} aria-disabled="true">{job.status === "draft" ? "Draft · not accepting applications" : "Closed"}</span>;
  return <Link to="/careers/$slug/apply" params={{ slug: job.slug }} className={`jd-apply ${className}`}>{label} <ArrowUpRight size={16} /></Link>;
}

function useSavedJob(job: CareerJob) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const list = useServerFn(listSavedJobs);
  const change = useServerFn(setSavedJob);
  const saved = useQuery({ queryKey: ["careers", "saved", user?.id], queryFn: () => list(), enabled: !!user, staleTime: 30_000 });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const isSaved = !!saved.data?.includes(job.id);
  const write = async (next: boolean) => {
    setBusy(true); setMessage(null);
    try { await change({ data: { jobId: job.id, saved: next } }); await queryClient.invalidateQueries({ queryKey: ["careers", "saved"] }); setMessage(next ? "Saved to your dashboard" : "Removed from saved roles"); }
    catch (e) { setMessage(e instanceof Error ? e.message : "This role could not be saved."); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    if (!ready || !user || sessionStorage.getItem(PENDING_SAVE) !== job.id) return;
    sessionStorage.removeItem(PENDING_SAVE);
    void write(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user, job.id]);
  const toggle = () => {
    if (!user) {
      sessionStorage.setItem(PENDING_SAVE, job.id);
      void navigate({ to: "/signin", search: { redirect: `/careers/${job.slug}` } });
      return;
    }
    void write(!isSaved);
  };
  return { isSaved, busy, message, toggle };
}

function CoverBanner({ job }: { job: CareerJob }) {
  const url = useHiringMedia(job.cover_image_url);
  const [failed, setFailed] = useState<string | null>(null);
  return <div className="jd-cover" aria-hidden="true">{url && failed !== url && <img src={url} alt="" onError={() => setFailed(url)} />}</div>;
}

function VideoCard({ onOpen, hasVideo, poster, title }: { onOpen: () => void; hasVideo: boolean; poster: string | null; title: string }) {
  return <article className="jd-card jd-video-card">
    {poster && <img className="jd-video-poster" src={poster} alt="" />}
    <div className="jd-video-shade" />
    <span className="jd-video-badge"><Video size={13} />Video</span>
    <div className="jd-video-foot">
      <h3>{title}</h3>
      {hasVideo ? <button type="button" className="jd-play" onClick={onOpen} aria-label={`Play ${title}`}><Play size={20} fill="currentColor" /></button>
        : <span className="jd-video-soon">Video coming soon</span>}
    </div>
  </article>;
}

export function JobDetailsPage({ slug }: { slug: string }) {
  const { data: publicDetail } = useSuspenseQuery(careerDetailOptions(slug));
  const { data: videoSettings } = useSuspenseQuery(internshipVideoOptions);
  const { data: allJobs } = useQuery(careerJobsOptions);
  const identity = useCareersIdentity(slug);
  const detail = identity.data?.detail ?? publicDetail;
  if (!detail) return <CareerUnavailable checking={identity.isFetching} error={identity.isError} />;
  const existing = !!identity.data?.applications.some((a) => a.job_id === detail.job.id);
  return <JobPage job={detail.job} existing={existing} videoSettings={videoSettings} others={(allJobs ?? []).filter((j) => j.id !== detail.job.id && j.status === "open")} />;
}

function JobPage({ job, existing, videoSettings, others }: { job: CareerJob; existing: boolean; videoSettings: Parameters<typeof InternshipVideo>[0]["settings"]; others: CareerJob[] }) {
  const internship = showInternshipVideo(job.type);
  const [videoOpen, setVideoOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stickyApply, setStickyApply] = useState(false);
  const heroApply = useRef<HTMLDivElement>(null);
  const save = useSavedJob(job);
  const video = resolveInternshipVideo(videoSettings.internship_video_url);
  const uploadedPoster = useHiringMedia(videoSettings.internship_video_poster_url);
  const poster = videoSettings.internship_video_poster_url ? uploadedPoster : youtubePoster(videoSettings.internship_video_url);
  const videoTitle = videoSettings.internship_video_title?.trim() || "Hear it from our AI Director";
  const faqs = jobFaqs(job.job_faqs);
  const url = `https://admakai.com/careers/${job.slug}`;
  const location = `Dhaka · ${workModeLabel(job.work_mode)}`;
  const open = canApply(job);

  useEffect(() => {
    const node = heroApply.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setStickyApply(!!entry && !entry.isIntersecting && entry.boundingClientRect.top < 0));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); }
  };
  const lists: [string, string[]][] = [["What you'll learn", job.responsibilities], ["What you need", job.requirements]];

  return <div className="jd-page">
    <section className="jd-hero">
      {job.status === "draft" && <DraftBanner />}
      <Rise><Link to="/careers" className="jd-back"><ArrowLeft size={15} />All roles</Link></Rise>
      <Rise delay={0.05}><span className="jd-pill-badge"><span className="jd-dot" aria-hidden="true" />{internship ? "Admakai Internship Program" : "Careers at Admakai"} · {open ? "Applications open" : "Applications closed"}</span></Rise>
      <Rise delay={0.12}><h1>{internship ? <>You bring a laptop.<br />We'll teach you AI filmmaking from zero.</> : job.title}</h1></Rise>
      {job.summary && <Rise delay={0.2}><p className="jd-sub">{job.summary}</p></Rise>}
      <Rise delay={0.28}><div ref={heroApply} className="jd-hero-cta"><ApplyButton job={job} existing={existing} /></div></Rise>
      <Rise delay={0.34}><div className="jd-team-row">
        <span className="jd-avatars" aria-hidden="true">{team.slice(0, 4).map((m) => <span key={m.id} title={m.name}>{teamInitials(m.name).slice(0, 2)}</span>)}</span>
        <span>Learn directly from our AI Director and creative team{seatsLine(job.seats)}</span>
      </div></Rise>
    </section>

    {internship && <section className="jd-wrap">
      <Rise><div className="jd-showcase">
        <VideoCard onOpen={() => setVideoOpen(true)} hasVideo={!!video} poster={poster} title={videoTitle} />
        <div className="jd-showcase-side">
          <article className="jd-card jd-learn-card">
            <p className="jd-label">What you'll learn</p>
            <div className="jd-segments" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <span key={i} className={i < 3 ? "is-on" : ""} />)}</div>
            <p className="jd-learn-line">From your first prompt to your first brand film</p>
          </article>
          <article className="jd-card jd-months-card">
            <p className="jd-label">Your 6 months</p>
            <div className="jd-mini-stack">{MONTHS.map((m, i) => <div key={m.months} className="jd-mini" style={{ ["--i" as string]: i }}>
              <span className="jd-mini-num">0{i + 1}</span>
              <div><strong>{m.months}</strong><span>{m.title}</span></div>
              <em>{m.tag}</em>
            </div>)}</div>
          </article>
        </div>
      </div></Rise>
      <Rise delay={0.1}><div className="jd-brands">
        <p>Brands our team has made AI ads for</p>
        <div>{BRANDS.map((b) => <span key={b}>{b}</span>)}<span className="jd-brands-more">and 40+ more</span></div>
      </div></Rise>
    </section>}

    <section className="jd-wrap jd-post-wrap">
      <Rise><article className="jd-card jd-post">
        <div className="jd-cover-wrap">
          <CoverBanner job={job} />
          <span className="jd-logo-box"><img src="/brand/icon-512.png" alt="Admakai" width="56" height="56" /></span>
          <div className="jd-post-actions">
            <button type="button" className="jd-icon-btn" onClick={() => void copy()} aria-label="Copy link to this role"><Link2 size={16} /></button>
            {open && <button type="button" className={`jd-save ${save.isSaved ? "is-saved" : ""}`} onClick={save.toggle} disabled={save.busy} aria-pressed={save.isSaved}>
              {save.isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}{save.isSaved ? "Saved" : "Save"}
            </button>}
          </div>
        </div>
        <div className="jd-post-body">
          <p className="jd-post-status" role="status" aria-live="polite">{copied ? "Link copied" : save.message ?? ""}</p>
          <h2>{job.title}</h2>
          <p className="jd-muted">{postedLabel(job.created_at)}</p>
          <div className="jd-meta">
            <span className="jd-meta-org"><img src="/brand/icon-512.png" alt="" width="18" height="18" />Admakai<BadgeCheck size={15} className="jd-verified" aria-label="Verified" /></span>
            <span><MapPin size={14} />{location}</span>
            <a href="https://admakai.com" target="_blank" rel="noopener noreferrer">admakai.com</a>
          </div>
          <div className="jd-chips">{jobChips(job).map((c) => <span key={c}>{c}</span>)}{!open && <span className="is-closed">Closed</span>}</div>
          <hr className="jd-dots" />
          <div className={`jd-post-copy ${expanded ? "is-open" : ""}`} id="jd-post-copy">
            {job.description && <HiringRichText text={job.description} />}
            {lists.map(([title, items]) => items.length > 0 && <div key={title} className="jd-list"><h3>{title}</h3><ul>{items.map((item) => <li key={item}><Check size={15} />{item}</li>)}</ul></div>)}
            {job.who_its_for && <div className="jd-list"><h3>Who this is for</h3><HiringRichText text={job.who_its_for} /></div>}
          </div>
          <button type="button" className="jd-more" aria-expanded={expanded} aria-controls="jd-post-copy" onClick={() => setExpanded(!expanded)}>{expanded ? "Show less" : "Show more"}</button>
          <div className="jd-post-foot">
            <a href="#jd-faq" className="jd-outline">Read more</a>
            <ApplyButton job={job} existing={existing} label="Apply for this job" className="is-solid" />
          </div>
          {others.length > 0 && <>
            <hr className="jd-dots" />
            <div className="jd-more-roles">
              <p className="jd-label">More roles at Admakai <span>{others.length}</span></p>
              {others.map((o) => <Link key={o.id} to="/careers/$slug" params={{ slug: o.slug }} className="jd-role-row">
                <img src="/brand/icon-512.png" alt="" width="32" height="32" />
                <span><strong>{o.title}</strong><small>{workModeLabel(o.work_mode)} · {jobTypeLabel(o.type)}</small></span>
                <ArrowUpRight size={16} />
              </Link>)}
            </div>
          </>}
        </div>
      </article></Rise>
    </section>

    {internship && <section className="jd-wrap">
      <Rise><p className="jd-label jd-center">Your 6 months</p><h2 className="jd-section-title">Six months, three steps.</h2></Rise>
      <ol className="jd-timeline">{MONTHS.map((m, i) => <li key={m.months}><Rise delay={i * 0.1} className="jd-card jd-step">
        <span className="jd-step-num">0{i + 1}</span>
        <p className="jd-label">{m.months}</p>
        <h3>{m.title}</h3>
        <p className="jd-muted">{m.line}</p>
      </Rise></li>)}</ol>
    </section>}

    {faqs.length > 0 && <section className="jd-wrap jd-faq" id="jd-faq">
      <Rise><p className="jd-label jd-center">FAQ</p><h2 className="jd-section-title">Questions, answered.</h2></Rise>
      <Accordion type="single" collapsible className="jd-faq-list">{faqs.map((f, i) => <Rise key={f.question} delay={Math.min(i, 6) * 0.05}>
        <AccordionItem value={`faq-${i}`} className="jd-card jd-faq-item"><AccordionTrigger>{f.question}</AccordionTrigger><AccordionContent>{f.answer}</AccordionContent></AccordionItem>
      </Rise>)}</Accordion>
    </section>}

    <section className="jd-wrap">
      <Rise><div className="jd-card jd-final">
        <h2>Your first AI film starts with one application.</h2>
        <ApplyButton job={job} existing={existing} />
        <p className="jd-muted">Takes about 10 minutes. Saves as you go.</p>
      </div></Rise>
    </section>

    <div className={`jd-sticky ${stickyApply ? "is-visible" : ""}`} aria-hidden={!stickyApply}>
      <strong>{job.title}</strong>
      <ApplyButton job={job} existing={existing} label="Apply" className="is-small" />
    </div>

    <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
      <DialogContent className="jd-video-modal" data-lenis-prevent>
        <DialogTitle className="sr-only">{videoTitle}</DialogTitle>
        <DialogDescription className="sr-only">Admakai Internship Program video</DialogDescription>
        {videoOpen && <InternshipVideo key={videoSettings.internship_video_url} settings={videoSettings} autoPlay />}
      </DialogContent>
    </Dialog>
  </div>;
}
