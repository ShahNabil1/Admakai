import { useSuspenseQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Briefcase,
  Plus,
  Trophy,
} from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import "@/components/public/pages.css";
import { careerJobsOptions, internshipVideoOptions } from "@/lib/careers-query";
import { InternshipVideo, InternshipHeroPreview } from './InternshipVideo';
import { useCareersIdentity } from "./useCareersIdentity";
import { TalentPool } from "./TalentPool";
import { CareerSearch, CareerBoard } from "./CareerBoard";
import "./career-board.css";
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
  const { data: videoSettings } = useSuspenseQuery(internshipVideoOptions);
  const identity = useCareersIdentity();
  const jobs = identity.data?.staff ? identity.data.jobs : publicJobs;
  return (
    <div className="public-page careers career-board-page">
      <header className="career-hero">
        <div className="career-showreel" aria-hidden="true">
          <InternshipHeroPreview settings={videoSettings} />
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
            <CareerSearch />
          </Reveal>
        </div>
      </header>
      {identity.isError && <p role="alert" className="container-site">Staff previews and your applications could not load. Please refresh.</p>}
      <CareerBoard jobs={jobs} applications={identity.data?.applications ?? []} settings={videoSettings} />
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
          <InternshipVideo key={videoSettings.internship_video_url} settings={videoSettings} />
        </div>
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
