import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Clapperboard,
  Plus,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/Reveal";
import "@/components/public/pages.css";
import { careerJobsOptions } from "@/lib/careers-query";
import { matchesJob } from "@/lib/careers-rules";
import { useCareersIdentity } from "./useCareersIdentity";
import { ApplyLink, Deadline, DraftBanner, JobBadges } from "./CareerShared";
import { TalentPool } from "./TalentPool";
const filters = ["All", "Internship", "Full-time", "Freelance", "Office", "Remote", "Hybrid"];
const faq = [
  ["What are the working hours?", "3 PM to 6 PM and 8 PM to 11 PM, Bangladesh time."],
  [
    "Can I work remotely?",
    "Yes, remote and hybrid are both possible. You may be asked to come to the office for some sessions.",
  ],
  ["Do I have to pay for the learning?", "No. The internship has no fee."],
  [
    "When do I get paid?",
    "In-house work during the learning stage is part of your training. Any client project you are added to is paid, and you will always be told which work is client work.",
  ],
  [
    "Can I work with another agency at the same time?",
    "Not with a competing agency or AI video studio during the 6 month program.",
  ],
  [
    "What happens after 6 months?",
    "People who prove themselves are offered a salaried position in the team.",
  ],
];
export function CareersPage() {
  const { data: publicJobs } = useSuspenseQuery(careerJobsOptions);
  const identity = useCareersIdentity();
  const [filter, setFilter] = useState("All");
  const jobs = (identity.data?.staff ? identity.data.jobs : publicJobs).filter((job) =>
    matchesJob(job, filter),
  );
  return (
    <div className="public-page careers">
      <header className="career-hero">
        <div className="career-showreel" aria-hidden="true">
          <div className="career-film-lines" />
        </div>
        <div className="container-site career-hero-content">
          <Reveal>
            <p className="page-eyebrow">Careers at Admakai</p>
            <h1>
              Build ads the world
              <br /> hasn't seen <span className="serif">yet.</span>
            </h1>
            <p className="page-intro">
              Admakai makes ad films with AI instead of cameras. We are looking for people who think
              like filmmakers.
            </p>
            <div className="career-actions">
              <Button asChild className="page-call">
                <a href="#roles">
                  See open roles <ArrowDown />
                </a>
              </Button>
              <Button asChild variant="ghost" className="career-secondary">
                <a href="#how-hiring-works">
                  How hiring works <ArrowUpRight />
                </a>
              </Button>
            </div>
          </Reveal>
          <div className="career-hero-foot">
            <span>
              <Clapperboard size={16} /> Human-led. AI-made.
            </span>
            <a href="#internship" aria-label="Explore the internship">
              <ArrowDown size={18} />
            </a>
          </div>
        </div>
      </header>
      <section id="internship" className="page-paper page-section">
        <div className="container-site">
          <Reveal>
            <p className="page-eyebrow">Admakai Internship Program</p>
            <h2 className="section-title">
              Learn the craft.
              <br />
              <span className="serif">Earn your place.</span>
            </h2>
          </Reveal>
          <div className="career-program">
            {[
              [BookOpen, "Months 1 to 2", "Learn hands-on beside the team. No fee."],
              [Briefcase, "After that", "Paid project work for those who do well."],
              [Trophy, "Within 6 months", "A salaried team spot for anyone who proves themselves."],
            ].map(([Icon, title, copy], i) => {
              const I = Icon as typeof BookOpen;
              return (
                <Reveal key={String(title)} delay={i * 0.1}>
                  <div className="career-program-step">
                    <span className="career-step-icon">
                      <I size={24} />
                    </span>
                    <h3>{String(title)}</h3>
                    <p>{String(copy)}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
      <section id="roles" className="container-site page-section">
        <Reveal>
          <div className="career-heading">
            <div>
              <p className="page-eyebrow">Make your next move</p>
              <h2 className="section-title">
                Open roles<span className="serif">.</span>
              </h2>
            </div>
            <span>
              {jobs.length} {jobs.length === 1 ? "role" : "roles"}
            </span>
          </div>
        </Reveal>
        <div className="page-pills career-filters" aria-label="Filter roles">
          {filters.map((value) => (
            <Button
              key={value}
              variant="ghost"
              className={`filter-pill ${filter === value ? "active" : ""}`}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {value}
            </Button>
          ))}
        </div>
        {identity.isError && (
          <p role="alert">Staff previews and your applications could not load. Please refresh.</p>
        )}
        <div className="career-job-grid">
          {jobs.map((job, i) => (
            <Reveal key={job.id} delay={i * 0.07}>
              <article className="career-job-card">
                {job.status === "draft" && <DraftBanner />}
                <div className="career-card-top">
                  <span className="career-badge">{job.type}</span>
                  <Deadline job={job} />
                </div>
                <h3>
                  <Link to="/careers/$slug" params={{ slug: job.slug }}>
                    {job.title}
                  </Link>
                </h3>
                <JobBadges job={job} />
                <p>{job.summary}</p>
                <div className="career-card-actions">
                  <Button asChild variant="ghost">
                    <Link to="/careers/$slug" params={{ slug: job.slug }}>
                      View details <ArrowUpRight />
                    </Link>
                  </Button>
                  <ApplyLink
                    job={job}
                    existing={identity.data?.applications.some((a) => a.job_id === job.id)}
                  />
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        {!jobs.length && (
          <div className="career-empty">
            <Briefcase size={28} />
            <p>
              {filter === "All"
                ? "No open roles right now. Join the talent pool and we will reach out."
                : "No roles match this filter."}
            </p>
            <Button asChild variant="link">
              <a href="#talent-pool">
                Join the talent pool <ArrowDown />
              </a>
            </Button>
          </div>
        )}
      </section>
      <section id="how-hiring-works" className="page-section career-how">
        <div className="container-site">
          <Reveal>
            <p className="page-eyebrow">How hiring works</p>
            <h2 className="section-title">
              A clear path.
              <br />
              <span className="serif">No guessing games.</span>
            </h2>
          </Reveal>
          <ol className="career-timeline">
            {["Apply and sign", "Review", "Short task", "Interview", "Decision"].map((step, i) => (
              <Reveal key={step} delay={i * 0.08}>
                <li>
                  <span>0{i + 1}</span>
                  <h3>{step}</h3>
                </li>
              </Reveal>
            ))}
          </ol>
          <p className="career-track-note">You can track every step live from your dashboard.</p>
        </div>
      </section>
      <section className="container-site page-section career-faq">
        <div>
          <p className="page-eyebrow">A few things to know</p>
          <h2 className="section-title serif">Before you ask.</h2>
        </div>
        <div>
          {faq.map(([question, answer]) => (
            <details key={question}>
              <summary>
                {question}
                <Plus size={18} />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
      <TalentPool />
    </div>
  );
}
