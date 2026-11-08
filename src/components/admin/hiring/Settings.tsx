import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, X, Save } from "lucide-react";
import {
  readHiringSettings,
  saveHiringSettings,
  type HiringSettings,
} from "@/lib/hiring-admin.functions";
import { resolveInternshipVideo } from "@/lib/internship-video";
import { InternshipVideo } from "@/components/careers/InternshipVideo";
import { Action, ImageUpload } from "./Controls";
export function Settings() {
  const read = useServerFn(readHiringSettings),
    save = useServerFn(saveHiringSettings);
  const [settings, setSettings] = useState<HiringSettings | null>(null),
    [previews, setPreviews] = useState<Record<string, string>>({}),
    [email, setEmail] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    void read()
      .then((r) => {
        setSettings(r.settings);
        setPreviews(r.previews);
      })
      .catch(() => setError("Settings could not load. Hiring admin access is required."));
  }, []);
  if (error) return <p role="alert">{error}</p>;
  if (!settings) return <div className="admin-skeleton" />;
  const patch = (v: Partial<HiringSettings>) => setSettings({ ...settings, ...v });
  return (
    <>
      <header className="admin-head">
        <div>
          <p className="admin-eyebrow">Hiring</p>
          <h1>Settings</h1>
        </div>
        <Action
          primary
          disabled={busy}
          onClick={() => {
            if (
              settings.internship_video_url &&
              !resolveInternshipVideo(settings.internship_video_url)
            ) {
              toast.error("Enter a YouTube, Vimeo or direct MP4 URL.");
              return;
            }
            setBusy(true);
            void save({
              data: { ...settings, google_login_enabled: settings.google_login_enabled === true },
            })
              .then(() => toast.success("Hiring settings saved"))
              .catch((e) => toast.error(e instanceof Error ? e.message : "Settings could not save"))
              .finally(() => setBusy(false));
          }}
        >
          <Save size={15} />
          {busy ? "Saving…" : "Save settings"}
        </Action>
      </header>
      <div className="admin-form">
        <section className="hiring-settings-section">
          <h2>Email</h2>
          <div className="admin-form-row">
            <label>
              From email
              <input
                type="email"
                value={settings.from_email}
                onChange={(e) => patch({ from_email: e.target.value })}
              />
            </label>
            <label>
              Reply-to
              <input
                type="email"
                value={settings.reply_to ?? ""}
                onChange={(e) => patch({ reply_to: e.target.value })}
              />
            </label>
          </div>
          <label>
            Notify admin emails
            <div className="hiring-tags">
              {settings.notify_admin_emails.map((v) => (
                <span key={v}>
                  {v}
                  <Action
                    title="Remove email"
                    onClick={() =>
                      patch({
                        notify_admin_emails: settings.notify_admin_emails.filter((s) => s !== v),
                      })
                    }
                  >
                    <X size={12} />
                  </Action>
                </span>
              ))}
            </div>
            <div className="admin-actions">
              <input
                type="email"
                value={email}
                placeholder="Email address"
                aria-label="Notification email"
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                      patch({
                        notify_admin_emails: Array.from(
                          new Set([...settings.notify_admin_emails, email.trim()]),
                        ),
                      });
                      setEmail("");
                    }
                  }
                }}
              />
              <Action
                onClick={() => {
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    toast.error("Enter a valid email");
                    return;
                  }
                  patch({
                    notify_admin_emails: Array.from(
                      new Set([...settings.notify_admin_emails, email.trim()]),
                    ),
                  });
                  setEmail("");
                }}
              >
                <Plus size={14} />
                Add
              </Action>
            </div>
          </label>
        </section>
        <section className="hiring-settings-section">
          <h2>Company</h2>
          <label>
            Company address
            <textarea
              value={settings.company_address ?? ""}
              onChange={(e) => patch({ company_address: e.target.value })}
            />
          </label>
          <div className="admin-form-row">
            {(["pdf_logo_url", "authorised_signature_url"] as const).map((k) => (
              <ImageUpload
                key={k}
                label={k === "pdf_logo_url" ? "PDF logo" : "Authorised signature"}
                bucket="hiring-assets"
                value={previews[k] ?? null}
                onChange={(path, url) => {
                  patch({ [k]: path });
                  setPreviews({ ...previews, [k]: url });
                }}
              />
            ))}
          </div>
        </section>
        <section className="hiring-settings-section">
          <h2>Candidate help</h2>
          <label>
            WhatsApp help link
            <input
              type="url"
              placeholder="https://wa.me/…"
              value={settings.whatsapp_help_url ?? ""}
              onChange={(e) => patch({ whatsapp_help_url: e.target.value })}
            />
          </label>
        </section>
        <section className="hiring-settings-section">
          <h2>Internship video</h2>
          <div className="hiring-edit-layout">
            <div className="admin-form">
              <label>
                Video URL
                <input
                  type="url"
                  value={settings.internship_video_url ?? ""}
                  onChange={(e) => patch({ internship_video_url: e.target.value })}
                />
              </label>
              <label>
                Title
                <input
                  value={settings.internship_video_title ?? ""}
                  onChange={(e) => patch({ internship_video_title: e.target.value })}
                />
              </label>
              <ImageUpload
                label="Poster image"
                bucket="hiring-public"
                value={settings.internship_video_poster_url}
                onChange={(_, internship_video_poster_url) =>
                  patch({ internship_video_poster_url })
                }
              />
            </div>
            <div className="hiring-preview">
              <InternshipVideo key={settings.internship_video_url} settings={settings} />
            </div>
          </div>
        </section>
        <section className="hiring-settings-section">
          <h2>Sign in</h2>
          <label className="hiring-check">
            <input
              type="checkbox"
              checked={settings.google_login_enabled === true}
              onChange={(e) => patch({ google_login_enabled: e.target.checked })}
            />
            Allow Continue with Google
          </label>
          <p className="admin-hint">
            Turn on only after Google is set up in Supabase Authentication
          </p>
        </section>
      </div>
    </>
  );
}
