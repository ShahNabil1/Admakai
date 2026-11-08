import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { daysUntil, canApply } from "@/lib/careers-rules";
import type { CareerJob } from "@/lib/careers.functions";
import "./careers.css";
export function Deadline({ job }: { job: CareerJob }) {
  const days = daysUntil(job.deadline);
  return (
    <span>
      {days === null
        ? "Applications open"
        : days < 0
          ? "Closed"
          : days === 0
            ? "Closes today"
            : `Closes in ${days} days`}
    </span>
  );
}
export function JobBadges({ job }: { job: CareerJob }) {
  return (
    <div className="career-badges">
      <span className="career-badge">{job.type.replaceAll("_", " ")}</span>
      <span>
        <MapPin size={14} />
        {job.work_mode}
      </span>
      <span>
        <Clock size={14} />
        {job.schedule_text}
      </span>
      {job.seats !== null && (
        <span>
          <Users size={14} />
          {job.seats} seats
        </span>
      )}
    </div>
  );
}
export function ApplyLink({
  job,
  existing = false,
}: {
  job: CareerJob;
  existing?: boolean | undefined;
}) {
  if (existing)
    return (
      <Button asChild className="page-call">
        <Link to="/dashboard/careers">
          View my application <ArrowUpRight />
        </Link>
      </Button>
    );
  if (!canApply(job))
    return (
      <Button className="page-call" disabled>
        {job.status === "draft" ? "Draft · not accepting applications" : "Closed"}
      </Button>
    );
  return (
    <Button asChild className="page-call">
      <Link to="/careers/$slug/apply" params={{ slug: job.slug }}>
        Apply <ArrowUpRight />
      </Link>
    </Button>
  );
}
export function DraftBanner() {
  return (
    <div className="career-draft" role="status">
      Draft preview, not visible to the public
    </div>
  );
}
export function CareerUnavailable({
  checking = false,
  error = false,
}: {
  checking?: boolean;
  error?: boolean;
}) {
  return (
    <div className="public-page careers">
      <header className="container-site page-hero">
        <p className="page-eyebrow">Careers at Admakai</p>
        <h1>
          {checking
            ? "Checking this role…"
            : error
              ? "This role could not load"
              : "This role is not available"}
        </h1>
        <p className="page-intro">
          {!checking && !error
            ? "It may be a draft, closed or no longer listed."
            : error
              ? "Please refresh and try again."
              : ""}
        </p>
        <Button asChild className="page-call">
          <Link to="/careers">Back to careers</Link>
        </Button>
      </header>
    </div>
  );
}
