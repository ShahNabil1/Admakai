import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { talentInterests, talentSchema } from "@/lib/careers-rules";
import { joinTalentPool } from "@/lib/careers.functions";
export function TalentPool() {
  const save = useServerFn(joinTalentPool);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  return (
    <section id="talent-pool" className="page-paper page-section">
      <div className="container-site career-talent">
        <div>
          <p className="page-eyebrow">Stay in the picture</p>
          <h2 className="section-title">
            Your next role.
            <br />
            <span className="serif">Our next collaborator.</span>
          </h2>
          <p>No role that fits? Join our talent pool.</p>
        </div>
        {result?.ok ? (
          <div className="career-success" role="status">
            <Check />
            <h3>{result.message}</h3>
          </div>
        ) : (
          <form
            className="career-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              const parsed = talentSchema.safeParse({
                full_name: form.get("full_name"),
                email: form.get("email"),
                phone: form.get("phone"),
                portfolio_url: form.get("portfolio_url"),
                message: form.get("message"),
                interested_in: form.getAll("interested_in"),
              });
              if (!parsed.success) {
                setResult({
                  ok: false,
                  message: parsed.error.issues[0]?.message || "Please check your details.",
                });
                return;
              }
              setBusy(true);
              try {
                setResult(await save({ data: parsed.data }));
              } catch {
                setResult({
                  ok: false,
                  message: "Your details could not be saved. Please try again.",
                });
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="career-form-grid">
              <label>
                Full name
                <input
                  name="full_name"
                  required
                  minLength={2}
                  maxLength={150}
                  autoComplete="name"
                />
              </label>
              <label>
                Email
                <input name="email" type="email" required maxLength={254} autoComplete="email" />
              </label>
              <label>
                Phone <span>(optional)</span>
                <input name="phone" type="tel" maxLength={40} autoComplete="tel" />
              </label>
              <label>
                Portfolio link <span>(optional)</span>
                <input name="portfolio_url" type="url" maxLength={1000} placeholder="https://" />
              </label>
            </div>
            <fieldset>
              <legend>Interested in</legend>
              <div className="career-interests">
                {talentInterests.map((item) => (
                  <label key={item}>
                    <input type="checkbox" name="interested_in" value={item} />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label>
              Message <span>(optional)</span>
              <textarea name="message" rows={3} maxLength={3000} />
            </label>
            {result && !result.ok && <p role="alert">{result.message}</p>}
            <Button className="page-call career-dark-button" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Join the talent pool"}
              <ArrowUpRight />
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
