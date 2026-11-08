import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { hiringWorkspace, type HiringWorkspace as Data } from "@/lib/hiring-admin.functions";
import { hiringCanWrite } from "@/lib/hiring-admin-rules";
import { JobsList, JobEditor } from "./Jobs";
import { QuestionBank } from "./QuestionBank";
import { Agreements } from "./Agreements";
import { Settings } from "./Settings";
import {ApplicationBoard,ApplicantProfile,HiringOverview} from './Applications';
import {Interviews} from './Interviews';
import {TeamJourney} from './Journey';
import {HiringEmails} from './Emails';
import './review.css';
import "./hiring.css";
import "./apps.css";
export function HiringWorkspace() {
  const read = useServerFn(hiringWorkspace),
    location = useLocation();
  const [data, setData] = useState<Data | null>(null),
    [error, setError] = useState("");
  const reload = useCallback(async () => {
    try {
      setData(await read());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hiring could not load.");
    }
  }, [read]);
  useEffect(() => {
    void reload();
  }, [reload]);
  const parts = location.pathname.split("/"),
    page = parts[3] || "overview",
    id = parts[4];
  if (error)
    return (
      <section className="hiring-content">
        <h1>Hiring unavailable</h1>
        <p role="alert">{error}</p>
      </section>
    );
  if (!data) return <div className="admin-skeleton" />;
  const admin = hiringCanWrite(data.roles);
  const restricted = !admin && ["settings", "agreements", "journey", "emails"].includes(page);
  return (
    <section className="hiring-content">
      <nav className="hiring-nav" aria-label="Hiring sections">
        {data.roles.some(r=>['admin','reviewer'].includes(r))&&<><Link to="/admin/hiring" activeOptions={{exact:true}} className="admin-btn-ghost">Overview</Link><Link to="/admin/hiring/applications" className="admin-btn-ghost">Applications</Link></>}
        <Link to="/admin/hiring/interviews" className="admin-btn-ghost">Interviews</Link>
        <Link to="/admin/hiring/jobs" className="admin-btn-ghost">
          Jobs
        </Link>
        <Link to="/admin/hiring/questions" className="admin-btn-ghost">
          Question bank
        </Link>
        {admin && (
          <>
            <Link to="/admin/hiring/journey" className="admin-btn-ghost">Team journey</Link>
            <Link to="/admin/hiring/emails" className="admin-btn-ghost">Emails</Link>
            <Link to="/admin/hiring/agreements" className="admin-btn-ghost">
              Agreements
            </Link>
            <Link to="/admin/hiring/settings" className="admin-btn-ghost">
              Settings
            </Link>
          </>
        )}
      </nav>
      {restricted ? (
        <>
          <h1>No access</h1>
          <p>Only hiring admins can open this page.</p>
        </>
      ) : page === 'overview' ? <HiringOverview/> : page === 'applications' ? (id?<ApplicantProfile key={id} id={id}/>:<ApplicationBoard/>) : page === 'interviews' ? <Interviews/> : page === "jobs" ? (
        id ? (
          <JobEditor key={id} id={id} data={data} admin={admin} reload={reload} />
        ) : (
          <JobsList data={data} admin={admin} reload={reload} />
        )
      ) : page === "questions" ? (
        <QuestionBank data={data} admin={admin} reload={reload} />
      ) : page === "agreements" ? (
        <Agreements data={data} reload={reload} />
      ) : page === "journey" ? <TeamJourney/> : page === "emails" ? <HiringEmails/> : page === "settings" ? (
        <Settings />
      ) : null}
    </section>
  );
}
