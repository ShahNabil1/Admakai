import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readApplication, type ApplicationData } from "@/lib/application.functions";
import "./application.css";
export function ApplicationDone({ slug }: { slug: string }) {
  const read = useServerFn(readApplication);
  const [data, setData] = useState<ApplicationData | null>(null),
    [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void read({ data: { slug } })
      .then((value) => {
        if (active) {
          if (!value.application?.submitted_at)
            setError("No submitted application was found for this account.");
          else setData(value);
        }
      })
      .catch(() => {
        if (active) setError("Sign in to view your submitted application.");
      });
    return () => {
      active = false;
    };
  }, [read, slug]);
  return (
    <div className="application-page">
      <div className="application-wrap application-done">
        {data ? (
          <>
            <div className="application-done-mark">
              <Check size={32} />
            </div>
            <h1>Application submitted</h1>
            <p className="application-code">{data.application?.public_code}</p>
            {data.application?.is_test && <p className="application-hint">Test application</p>}
            <p>We will review it soon. You can track every step live.</p>
            <h2 className="mt-8 text-xl">What happens next</h2>
            <ol className="application-next-timeline">
              {data.stages
                .filter(
                  (s) =>
                    ["in_review", "shortlisted", "interview_scheduled", "selected"].includes(
                      s.key,
                    ) && !s.is_negative,
                )
                .map((stage) => (
                  <li key={stage.key}>{stage.candidate_label}</li>
                ))}
            </ol>
            <div className="application-pdf-slot">
              <p>Agreement PDF preview · coming next</p>
              <Button variant="outline" disabled>
                Download PDF
              </Button>
            </div>
            <div className="application-done-actions">
              <Button asChild>
                <Link to="/me">Go to my dashboard</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/careers">Back to careers</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <h1>{error ?? "Loading your application…"}</h1>
            {error && (
              <Button asChild>
                <Link to="/careers/$slug/apply" params={{ slug }}>
                  Return to application
                </Link>
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
