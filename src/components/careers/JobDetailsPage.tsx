import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/Reveal";
import { careerDetailOptions, internshipVideoOptions } from "@/lib/careers-query";
import { showInternshipVideo } from '@/lib/internship-video';
import { InternshipVideo } from './InternshipVideo';
import { HiringRichText } from './HiringRichText';
import { HiringCover } from './HiringCover';
import { ApplyLink, CareerUnavailable, Deadline, DraftBanner, JobBadges } from "./CareerShared";
import { useCareersIdentity } from "./useCareersIdentity";
import "@/components/public/pages.css";
export function JobDetailsPage({ slug }: { slug: string }) {
  const { data: publicDetail } = useSuspenseQuery(careerDetailOptions(slug));
  const { data: videoSettings } = useSuspenseQuery(internshipVideoOptions);
  const identity = useCareersIdentity(slug);
  const detail = identity.data?.detail ?? publicDetail;
  const [share, setShare] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!detail) return <CareerUnavailable checking={identity.isFetching} error={identity.isError} />;
  const { job, stages, terms } = detail;
  const existing = identity.data?.applications.some((a) => a.job_id === job.id);
  const url = `https://admakai.com/careers/${job.slug}`;
  return (
    <div className="public-page careers">
      <header className="container-site page-hero career-detail-hero">
        <Link to="/careers" className="career-back">
          <ArrowLeft size={16} /> All roles
        </Link>
        {job.status === "draft" && <DraftBanner />}
        <Reveal>
          <p className="page-eyebrow">Careers at Admakai</p>
          <h1>{job.title}</h1>
          <JobBadges job={job} />
          <div className="career-detail-meta">
            <Deadline job={job} />
            <div>
              <Button variant="ghost" onClick={() => setShare(!share)} aria-expanded={share}>
                <Share2 />
                Share
              </Button>
              {share && (
                <div className="career-share">
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(url);
                        setCopied(true);
                      } catch {
                        setCopied(false);
                      }
                    }}
                  >
                    <Copy />
                    {copied ? "Copied" : "Copy link"}
                  </Button>
                  {[
                    [
                      "WhatsApp",
                      `https://wa.me/?text=${encodeURIComponent(job.title + " " + url)}`,
                    ],
                    [
                      "Facebook",
                      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
                    ],
                    [
                      "LinkedIn",
                      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
                    ],
                  ].map(([label, href]) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer">
                      {label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Reveal>
      </header>
      <div className="container-site career-detail-layout">
        <div className="career-detail-copy">
          <HiringCover value={job.cover_image_url} title={job.title} />
          <section>
            <Reveal>
              <h2>About this role</h2>
              <p>{job.summary}</p>
              {job.description && <HiringRichText text={job.description}/>}
            </Reveal>
          </section>
          {showInternshipVideo(job.type) && <InternshipVideo key={videoSettings.internship_video_url} settings={videoSettings} compact />}
          {[
            ["What you will do", job.responsibilities],
            ["What you need", job.requirements],
            ["Nice to have", job.nice_to_have],
          ].map(
            ([title, items]) =>
              (items as string[]).length > 0 && (
                <section key={String(title)}>
                  <Reveal>
                    <h2>{String(title)}</h2>
                    <ul>
                      {(items as string[]).map((item) => (
                        <li key={item}>
                          <Check size={17} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                </section>
              ),
          )}
          <section>
            <Reveal>
              <h2>Tools you will use</h2>
              <div className="career-badges">
                {job.tools.map((tool) => (
                  <span className="career-tool" key={tool}>
                    {tool}
                  </span>
                ))}
              </div>
            </Reveal>
          </section>
          <section>
            <Reveal>
              <h2>What you get</h2>
              <ul>
                {job.benefits.map((item) => (
                  <li key={item}>
                    <Check size={17} />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </section>
          {!!stages.length && (
            <section>
              <h2>Your journey with us</h2>
              <div className="career-journey">
                {stages.map((stage, i) => (
                  <Reveal key={stage.key} delay={i * 0.08}>
                    <span className="career-journey-number">0{i + 1}</span>
                    <h3>{stage.candidate_label}</h3>
                    {stage.expected_days !== null && <p>Approx. {stage.expected_days} days</p>}
                  </Reveal>
                ))}
              </div>
            </section>
          )}
          {!!terms.length && (
            <section>
              <Reveal>
                <h2>Rules in short</h2>
                <ul>
                  {terms.map((term) => (
                    <li key={term}>
                      <Check size={17} />
                      {term}
                    </li>
                  ))}
                </ul>
                <p className="career-note">
                  You will read and sign the full agreement while applying.
                </p>
              </Reveal>
            </section>
          )}
          <section>
            <Reveal>
              <h2>Before you apply</h2>
              <p>
                Keep your portfolio link and CV ready. The application takes about 20 minutes and
                saves automatically, so you can finish later.
              </p>
              <ApplyLink job={job} existing={existing} />
            </Reveal>
          </section>
        </div>
        <aside className="career-apply-panel">
          <p className="page-eyebrow">Your next chapter</p>
          <h2>
            Make something
            <br />
            <span className="serif">worth watching.</span>
          </h2>
          <Deadline job={job} />
          <ApplyLink job={job} existing={existing} />
        </aside>
      </div>
      <div className="career-mobile-apply">
        <Deadline job={job} />
        <ApplyLink job={job} existing={existing} />
      </div>
    </div>
  );
}
