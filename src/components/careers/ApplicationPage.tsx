import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Check, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import {
  APPLICATION_STEPS,
  AUTOSAVE_MS,
  CV_LIMIT,
  answerError,
  candidateSchema,
  candidateDraftSchema,
  fillAgreement,
  nextApplicationStep,
  normalizeName,
  previousApplicationStep,
  questionStep,
  validUrl,
  type Answer,
  type CandidateFields,
} from "@/lib/application-rules";
import {
  readApplication,
  saveOpeningsPreference,
  saveCandidate,
  saveApplication,
  uploadApplicationFile,
  removeApplicationCv,
  recordApplicationSignature,
  saveApplicationTask,
  submitApplication,
  type ApplicationData,
  type ApplicationRow,
  type SignedRow,
} from "@/lib/application.functions";
import { ApplicationQuestion } from "./ApplicationQuestion";
import { ApplicationSignature } from "./ApplicationSignature";
import { HiringRichText } from './HiringRichText';
import { ApplicationSignIn } from './ApplicationSignIn';
import { PassportCrop } from './PassportCrop';
import { passportFileError } from '@/lib/passport-rules';
import logo from '@/assets/brand/logo-dark-cropped.png.asset.json';
import './apply-redesign.css';
import "./application.css";

const emptyCandidate: CandidateFields = {
  full_name: "",
  phone: "",
  whatsapp: "",
  area: "",
  education: "",
  current_occupation: "",
};
const personalLabels: Record<keyof CandidateFields, string> = {
  full_name: "Full name",
  phone: "Phone",
  whatsapp: "WhatsApp",
  area: "Area or city",
  education: "Education",
  current_occupation: "What do you do now?",
};
type Snapshot = {
  candidate: CandidateFields;
  answers: Record<string, Answer>;
  step: number;
  cvPath: string | null;
  taskUrl: string;
  later: boolean;
};
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : "Your changes could not be saved. Please try again.";

export function ApplicationPage({
  slug,
  googleEnabled,
  publicTitle,
  whatsappHelpUrl,
}: {
  slug: string;
  googleEnabled: boolean;
  publicTitle: string | null;
  whatsappHelpUrl?: string | null;
}) {
  const pathname = useLocation({ select: (location) => location.pathname });
  const pathRef = useRef(pathname);
  pathRef.current = pathname;
  const navigate = useNavigate();
  const read = useServerFn(readApplication),
    savePerson = useServerFn(saveCandidate),
    savePreference = useServerFn(saveOpeningsPreference),
    save = useServerFn(saveApplication),
    upload = useServerFn(uploadApplicationFile),
    removeCv = useServerFn(removeApplicationCv),
    record = useServerFn(recordApplicationSignature),
    saveTask = useServerFn(saveApplicationTask),
    submit = useServerFn(submitApplication);
  const [data, setData] = useState<ApplicationData | null>(null),
    [loading, setLoading] = useState(true),
    [signedIn, setSignedIn] = useState(false),
    [step, setStep] = useState(1),
    [candidate, setCandidate] = useState<CandidateFields>(emptyCandidate),
    [answers, setAnswers] = useState<Record<string, Answer>>({}),
    [application, setApplication] = useState<ApplicationRow | null>(null),
    [cvPath, setCvPath] = useState<string | null>(null),
    [cvName, setCvName] = useState(""),
    [photo, setPhoto] = useState<File | null>(null),
    [cropFile, setCropFile] = useState<File | null>(null),
    [passportPath, setPassportPath] = useState<string | null>(null),
    [photoUrl, setPhotoUrl] = useState<string | null>(null),
    [samePhone, setSamePhone] = useState(true),
    [taskUrl, setTaskUrl] = useState(""),
    [later, setLater] = useState(false),
    [signed, setSigned] = useState<SignedRow | null>(null),
    [signatureUrl, setSignatureUrl] = useState<string | null>(null),
    [signature, setSignature] = useState<Blob | null>(null),
    [signedName, setSignedName] = useState(""),
    [readEnd, setReadEnd] = useState(false),
    [terms, setTerms] = useState<string[]>([]),
    [confirmed, setConfirmed] = useState(false),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [notice, setNotice] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(""),
    [dirty, setDirty] = useState(0),
    [today, setToday] = useState<Date | null>(null);
  const gate = useRef(false),
    active = useRef(true),
    submitted = useRef(false),
    queue = useRef<Promise<unknown>>(Promise.resolve()),
    revision = useRef(0),
    appRef = useRef<ApplicationRow | null>(null),
    agreementBox = useRef<HTMLDivElement>(null),
    photoInput = useRef<HTMLInputElement>(null),
    cvInput = useRef<HTMLInputElement>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    snapshot = useRef<Snapshot>({
      candidate: emptyCandidate,
      answers: {},
      step: 1,
      cvPath: null,
      taskUrl: "",
      later: false,
    });
  snapshot.current = { candidate, answers, step, cvPath, taskUrl, later };
  const load = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const { data: user, error } = await supabase.auth.getUser();
      if (error || !user.user) {
        setSignedIn(false);
        setStep(1);
        return;
      }
      setSignedIn(true);
      const result = await read({ data: { slug } });
      if (!active.current) return;
      if (result.application && !result.application.is_draft) {
        if (!gate.current && !pathRef.current.endsWith("/done"))
          await navigate({ to: "/dashboard/careers", replace: true });
        return;
      }
      setData(result);
      const preference = sessionStorage.getItem("admakai-openings-updates");
      if (preference !== null) { await savePreference({ data: { enabled: preference === "true" } }); sessionStorage.removeItem("admakai-openings-updates"); }
      setPassportPath(result.application?.passport_photo_path ?? null);
      const c = result.candidate;
      setCandidate({
        full_name: c.full_name,
        phone: c.phone ?? "",
        whatsapp: c.whatsapp ?? "",
        area: c.area ?? "",
        education: c.education ?? "",
        current_occupation: c.current_occupation ?? "",
      });
      setSamePhone(!c.whatsapp || c.whatsapp === c.phone);
      setAnswers(result.answers);
      setApplication(result.application);
      appRef.current = result.application;
      setCvPath(result.application?.cv_path ?? null);
      setCvName(result.application?.cv_path ? "cv.pdf" : "");
      setTaskUrl(result.application?.task_submission_url ?? "");
      setLater(!result.application?.task_submission_url);
      setSigned(result.signed);
      setSignatureUrl(result.signatureUrl);
      setPhotoUrl(result.application?.passport_photo_path ? result.photoUrl : null);
      setSignedName(result.signed?.signer_full_name ?? "");
      setTerms(
        Array.isArray(result.signed?.accepted_terms)
          ? result.signed.accepted_terms.filter((v): v is string => typeof v === "string")
          : [],
      );
      let resume = Math.max(2, Math.min(7, result.application?.current_step ?? 2));
      if (resume === 5 && !result.job.task_enabled) resume = 6;
      setStep(resume);
    } catch (error) {
      setNotice(errorText(error));
    } finally {
      if (active.current) setLoading(false);
    }
  }, [navigate, read, slug]);
  useEffect(() => {
    active.current = true;
    setToday(new Date());
    void load();
    return () => {
      active.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [load]);
  useEffect(() => {
    if (step !== 6) return;
    const el = agreementBox.current;
    if (el && el.scrollHeight <= el.clientHeight + 3) setReadEnd(true);
  }, [step, data?.template]);
  const changed = () => {
    revision.current++;
    setDirty(revision.current);
    setSaved("Unsaved changes");
  };
  const jumpFocus = (field: string) => {
    requestAnimationFrame(() => {
      const el = document.getElementById(`field-${field}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    });
  };
  const persist = useCallback(
    async (target: number, forced?: Snapshot) => {
      const state = forced ?? snapshot.current;
      if (!data || submitted.current) return null;
      const person = candidateSchema.safeParse(state.candidate);
      if (!person.success) throw new Error("Complete your personal details to save.");
      const validAnswers: Record<string, Answer> = {};
      for (const q of data.questions) {
        const value = state.answers[q.id];
        if (value !== undefined && !answerError({ ...q, required: false }, value))
          validAnswers[q.id] = value;
      }
      await savePerson({ data: person.data });
      const app = await save({
        data: { jobId: data.job.id, step: target, answers: validAnswers, cvPath: state.cvPath },
      });
      appRef.current = app;
      if (active.current) {
        setApplication(app);
      }
      if (
        data.job.task_enabled &&
        (state.later || !state.taskUrl.trim() || validUrl(state.taskUrl.trim()))
      )
        await saveTask({
          data: {
            id: app.id,
            url: state.later || !state.taskUrl.trim() ? null : state.taskUrl.trim(),
          },
        });
      return app;
    },
    [data, save, savePerson, saveTask],
  );
  const serialized = useCallback(
    (target: number, state?: Snapshot, version?: number) => {
      const operation = queue.current
        .catch(() => undefined)
        .then(() =>
          version !== undefined && version !== revision.current ? null : persist(target, state),
        );
      queue.current = operation;
      return operation;
    },
    [persist],
  );
  useEffect(() => {
    if (!dirty || !data || !signedIn || busy || submitted.current) return;
    const version = revision.current;
    timer.current = setTimeout(() => {
      if (gate.current) return;
      const state = snapshot.current;
      setSaved("Saving…");
      const valid = candidateSchema.safeParse(state.candidate);
      if (!valid.success) {
        const draft = candidateDraftSchema.safeParse(state.candidate);
        if (!draft.success) {
          setSaved("Complete the phone number to save");
          return;
        }
        const operation = queue.current
          .catch(() => undefined)
          .then(() =>
            version === revision.current ? savePerson({ data: draft.data }) : undefined,
          );
        queue.current = operation;
        void operation
          .then(() => {
            if (active.current && version === revision.current) setSaved("Saved");
          })
          .catch((error) => {
            setSaved("Not saved");
            setNotice(errorText(error));
          });
        return;
      }
      void serialized(state.step, state, version)
        .then(() => {
          if (active.current && version === revision.current) setSaved("Saved");
        })
        .catch((error) => {
          if (active.current) {
            setSaved("Not saved");
            setNotice(errorText(error));
          }
        });
    }, AUTOSAVE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [dirty, data, signedIn, busy, serialized, savePerson]);
  const validate = (current: number) => {
    const nextErrors: Record<string, string> = {};
    if (current === 2) {
      if (!photo && !passportPath) nextErrors["passport"] = "Choose and crop your passport size photo.";
      const result = candidateSchema.safeParse(candidate);
      if (!result.success)
        for (const issue of result.error.issues) {
          const field = String(issue.path[0]);
          nextErrors[field] = issue.message;
        }
    }
    if (data && [3, 4].includes(current))
      for (const q of data.questions.filter((q) => questionStep(q) === current)) {
        const error = answerError(q, answers[q.id]);
        if (error) nextErrors[q.id] = error;
      }
    if (current === 5 && !later) {
      if (!taskUrl.trim() || !validUrl(taskUrl.trim()))
        nextErrors["task"] = "Enter a valid task link or choose to submit later.";
    }
    if (current === 5 && data)
      for (const q of data.questions.filter((q) => questionStep(q) === 5)) {
        const error = answerError(q, answers[q.id]);
        if (error) nextErrors[q.id] = error;
      }
    if (current === 6 && data) {
      const all = Array.isArray(data.template?.key_terms)
        ? data.template.key_terms.filter((v): v is string => typeof v === "string")
        : [];
      if (!data.template) nextErrors["agreement"] = "This agreement is not available yet.";
      else if (!readEnd) nextErrors["agreement"] = "Please read to the end to continue.";
      else if (all.some((t) => !terms.includes(t)))
        nextErrors["agreement"] = "Accept every agreement term.";
      if (normalizeName(signedName) !== normalizeName(candidate.full_name))
        nextErrors["signedName"] = "Your name must match the full name above.";
      const existing =
        signed &&
        normalizeName(signed.signer_full_name) === normalizeName(candidate.full_name) &&
        signed.template_id === data.template?.id;
      if (!signature && !existing)
        nextErrors["signature"] = "Draw a fuller signature, not a tiny scribble.";
    }
    setErrors(nextErrors);
    const first = Object.keys(nextErrors)[0];
    if (first) {
      jumpFocus(first);
      return false;
    }
    return true;
  };
  const run = async (action: () => Promise<void>) => {
    if (gate.current) return;
    gate.current = true;
    setBusy(true);
    setNotice(null);
    if (timer.current) clearTimeout(timer.current);
    try {
      await action();
    } catch (error) {
      setNotice(errorText(error));
      setSaved("Not saved");
    } finally {
      gate.current = false;
      if (active.current) setBusy(false);
    }
  };
  const uploadFile = async (
    kind: "photo" | "cv" | "signature" | "passport",
    file: File,
    app: ApplicationRow,
  ) => {
    const payload = new FormData();
    payload.set("applicationId", app.id);
    payload.set("kind", kind);
    payload.set("file", file);
    return upload({ data: payload });
  };
  const next = () => {
    if (!validate(step)) return;
    void run(async () => {
      const target = nextApplicationStep(step, data?.job.task_enabled ?? true);
      const app = await serialized(step);
      if (!app || !data) return;
      let latestCv = cvPath;
      if (step === 2 && photo) {
        const result = await uploadFile("passport", photo, app);
        setPhotoUrl(result.signedUrl);
        setPassportPath(result.path);
        setPhoto(null);
      }
      if (step === 6 && signature) {
        const result = await uploadFile(
          "signature",
          new File([signature], "signature.png", { type: "image/png" }),
          app,
        );
        const row = await record({
          data: {
            id: app.id,
            name: signedName,
            path: result.path,
            terms,
            userAgent: navigator.userAgent.slice(0, 1000),
          },
        });
        setSigned(row);
        setSignatureUrl(result.signedUrl);
        setSignature(null);
      }
      await serialized(target, { ...snapshot.current, cvPath: latestCv });
      setSaved("Saved");
      setStep(target);
      setErrors({});
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };
  const back = (target: number) =>
    void run(async () => {
      if (candidateSchema.safeParse(candidate).success) await serialized(target);
      else {
        const draft = candidateDraftSchema.safeParse(candidate);
        if (!draft.success) {
          setNotice("Complete the phone number before leaving this step.");
          return;
        }
        await queue.current.catch(() => undefined);
        await savePerson({ data: draft.data });
      }
      setStep(target);
      setErrors({});
      setReadEnd(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  const updatePerson = (key: keyof CandidateFields, value: string) => {
    setCandidate((old) => ({
      ...old,
      [key]: value,
      ...(key === "phone" && samePhone ? { whatsapp: value } : {}),
    }));
    setErrors((old) => ({ ...old, [key]: "" }));
    changed();
    if (key === "full_name" && normalizeName(value) !== normalizeName(candidate.full_name)) {
      setSigned(null);
      setSignatureUrl(null);
      setSignature(null);
      setReadEnd(false);
      setTerms([]);
      setConfirmed(false);
    }
  };
  const termsList = Array.isArray(data?.template?.key_terms)
    ? data.template.key_terms.filter((v): v is string => typeof v === "string")
    : [];
  const currentQuestions = data?.questions.filter((q) => questionStep(q) === step) ?? [];
  let section: string | null = null;
  const title = data?.job.title ?? publicTitle ?? "Your application";
  const visibleSteps = APPLICATION_STEPS.map((name, i) => ({ name, number: i + 1 })).filter(s => s.number !== 5 || (data?.job.task_enabled ?? slug !== 'ai-artist-intern'));
  const visibleIndex = Math.max(0, visibleSteps.findIndex(s => s.number === step));
  const exit = (dashboard: boolean) => void run(async () => {
    if (signedIn && data) {
      if (candidateSchema.safeParse(candidate).success) {
        const app = await serialized(step);
        if (photo && app) { const result = await uploadFile('passport', photo, app); setPassportPath(result.path); setPhoto(null); }
      } else {
        const draft = candidateDraftSchema.safeParse(candidate);
        if (!draft.success) throw new Error('Please correct your personal details before saving.');
        await queue.current.catch(() => undefined); await savePerson({ data: draft.data });
      }
    }
    await navigate({ href: dashboard ? '/dashboard' : `/careers/${encodeURIComponent(slug)}` });
  });
  const currentSignatureValid =
    !!signed &&
    normalizeName(signed.signer_full_name) === normalizeName(candidate.full_name) &&
    signed.template_id === data?.template?.id;
  const renderQuestions = () =>
    currentQuestions.map((q) => {
      const heading = q.section !== section;
      section = q.section;
      return (
        <div key={q.id}>
          {heading && q.section && <><h3 className="application-section-title">{q.section}</h3>{q.section === "About you as a creator" && <p className="application-hint">There are no right or wrong answers. We want to know how you think, not what you already know.</p>}</>}
          <ApplicationQuestion
            question={q}
            value={answers[q.id]}
            {...(errors[q.id] ? { error: errors[q.id] } : {})}
            onChange={(value) => {
              setAnswers((old) => ({ ...old, [q.id]: value }));
              setErrors((old) => ({ ...old, [q.id]: "" }));
              changed();
            }}
          />
        </div>
      );
    });
  const reviewGroup = (number: number, content: React.ReactNode) => (
    <section className="application-review-group" key={number}>
      <header>
        <h3>{APPLICATION_STEPS[number - 1]}</h3>
        <Button type="button" variant="link" onClick={() => back(number)}>
          Edit
        </Button>
      </header>
      {content}
    </section>
  );
  if (!loading && !signedIn) return <div className="apply-auth-page"><ApplicationSignIn returnPath={`/careers/${encodeURIComponent(slug)}/apply`} onSignedIn={load} googleEnabled={googleEnabled} /></div>;
  return (
    <div className="application-page apply-wizard-page">
      <div className="apply-wizard-card">
        <Button type="button" variant="ghost" className="apply-close" aria-label="Save draft and close" title="Save draft and close" disabled={busy} onClick={() => exit(false)}><X size={20} /></Button>
        <aside className="apply-wizard-rail">
          <img className="apply-logo" src={logo.url} alt="Admakai" />
          <h1>Apply to Admakai</h1><p className="apply-job-title">{title}</p>
          <div className="apply-mobile-progress"><p>Step {visibleIndex + 1} of {visibleSteps.length}</p><div className="application-progress" role="progressbar" aria-valuemin={1} aria-valuemax={visibleSteps.length} aria-valuenow={visibleIndex + 1} aria-label="Application progress">{visibleSteps.map(s => <span key={s.number} className={s.number <= step ? 'complete' : ''} />)}</div></div>
          <ol className="apply-step-list">{visibleSteps.map((s, index) => <li key={s.number} className={s.number === step ? 'current' : s.number < step ? 'done' : ''}><span>{s.number < step ? <Check size={15} /> : s.number === step ? <Loader2 size={15} className="apply-current-spinner" /> : index + 1}</span>{s.name}</li>)}</ol>
          <div className="apply-rail-footer"><p>Saves automatically</p>{application && <p>{application.public_code}</p>}{whatsappHelpUrl && /^https:\/\/(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)\//.test(whatsappHelpUrl) && <a href={whatsappHelpUrl} target="_blank" rel="noopener noreferrer">WhatsApp help</a>}</div>
        </aside>
        <div className="application-panel apply-wizard-fields" key={step}>
            {data?.job.status === "draft" && (
              <p className="career-draft">Draft preview · This is a test application</p>
            )}
            {loading ? (
              <p role="status">
                <Loader2 className="animate-spin" /> Loading your application…
              </p>
            ) : (
              <>
                <h2>{APPLICATION_STEPS[step - 1]}</h2>
                {notice && (
                  <p className="application-error" role="alert">
                    {notice}
                  </p>
                )}
                {data ? (
                  <form
                    className="application-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      next();
                    }}
                    noValidate
                  >
                    {step === 2 && (
                      <>
                        <div className="apply-personal-grid">{(Object.keys(personalLabels) as (keyof CandidateFields)[]).map((key) => (
                          <div
                            className={`application-field ${errors[key] ? "invalid" : ""}`}
                            key={key}
                            id={`field-${key}`}
                            tabIndex={-1}
                          >
                            {key === "whatsapp" && (
                              <label className="application-check">
                                <input
                                  type="checkbox"
                                  checked={samePhone}
                                  onChange={(e) => {
                                    setSamePhone(e.target.checked);
                                    if (e.target.checked)
                                      setCandidate((old) => ({ ...old, whatsapp: old.phone }));
                                    changed();
                                  }}
                                />
                                Same as phone
                              </label>
                            )}
                            {(key !== "whatsapp" || !samePhone) && (
                              <label>
                                {personalLabels[key]}
                                {key !== "whatsapp" ? " *" : ""}
                                <input
                                  type={key === "phone" || key === "whatsapp" ? "tel" : "text"}
                                  autoComplete={
                                    key === "full_name"
                                      ? "name"
                                      : key === "phone"
                                        ? "tel"
                                        : undefined
                                  }
                                  value={candidate[key]}
                                  maxLength={
                                    key === "full_name"
                                      ? 100
                                      : key === "phone" || key === "whatsapp"
                                        ? 20
                                        : key === "area"
                                          ? 150
                                          : 300
                                  }
                                  onChange={(e) => updatePerson(key, e.target.value)}
                                />
                                {key === 'full_name' && <p className="application-hint">Write your name in English, as on your NID</p>}
                              </label>
                            )}
                            {errors[key] && (
                              <p className="application-error" role="alert">
                                {errors[key]}
                              </p>
                            )}
                          </div>
                        ))}</div>
                        <div id="field-passport" tabIndex={-1} className={errors['passport'] ? 'application-field invalid' : 'application-field'}>
                          <label>Passport size photo *</label>
                          <p className="application-hint">A recent photo with your face clearly visible, plain light background, no sunglasses or filters.</p>
                          <div className="application-upload">
                            {photoUrl && <img src={photoUrl} alt="Your passport photo" />}
                            <span>
                              {photo?.name ?? (photoUrl ? "Photo saved" : "No photo selected")}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => photoInput.current?.click()}
                            >
                              <Upload />
                              {photoUrl ? "Replace" : "Choose photo"}
                            </Button>
                          </div>
                          <input
                            className="application-file-input"
                            ref={photoInput}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              e.target.value = '';
                              const error = passportFileError(file);
                              if (error) { setNotice(error); return; }
                              setCropFile(file);
                              setNotice(null);
                            }}
                          />
                          {errors['passport'] && <p className="application-error" role="alert">{errors['passport']}</p>}
                        </div>
                      </>
                    )}
                    {[3, 4].includes(step) && renderQuestions()}
                    {step === 4 && (
                      <div className="application-field">
                        <label>
                          CV <span className="application-hint">Optional · PDF · up to 5 MB</span>
                        </label>
                        <div className="application-upload">
                          <span>{cvPath ? cvName || "cv.pdf" : "No CV uploaded"}</span>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={busy}
                            onClick={() => cvInput.current?.click()}
                          >
                            <Upload />
                            {cvPath ? "Replace" : "Upload PDF"}
                          </Button>
                          {cvPath && (
                            <Button
                              type="button"
                              variant="ghost"
                              disabled={busy}
                              onClick={() =>
                                void run(async () => {
                                  const app = appRef.current;
                                  if (!app) return;
                                  await removeCv({ data: { id: app.id } });
                                  setCvPath(null);
                                  setCvName("");
                                  await serialized(step, { ...snapshot.current, cvPath: null });
                                  setSaved("Saved");
                                })
                              }
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <input
                          ref={cvInput}
                          type="file"
                          className="application-file-input"
                          accept="application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (!file) return;
                            if (file.type !== "application/pdf" || file.size > CV_LIMIT) {
                              setNotice("Choose a PDF up to 5 MB.");
                              return;
                            }
                            void run(async () => {
                              const app = await serialized(step);
                              if (!app) return;
                              const result = await uploadFile("cv", file, app);
                              setCvPath(result.path);
                              setCvName(file.name);
                              await serialized(step, { ...snapshot.current, cvPath: result.path });
                              setSaved("Saved");
                            });
                          }}
                        />
                      </div>
                    )}
                    {step === 5 && (
                      <>
                        <div className="application-task">
                          <HiringRichText text={data.job.task_brief ?? ''}/>
                          <p>
                            Due within {data.job.task_due_days ?? 3} days after you are shortlisted.
                          </p>
                        </div>
                        <div
                          id="field-task"
                          className={`application-field ${errors["task"] ? "invalid" : ""}`}
                          tabIndex={-1}
                        >
                          <label>
                            Task link
                            <input
                              type="url"
                              value={taskUrl}
                              disabled={later}
                              maxLength={2048}
                              onChange={(e) => {
                                setTaskUrl(e.target.value);
                                changed();
                              }}
                            />
                          </label>
                          {errors["task"] && <p className="application-error">{errors["task"]}</p>}
                        </div>
                        {renderQuestions()}
                        <label className="application-check">
                          <input
                            type="checkbox"
                            checked={later}
                            onChange={(e) => {
                              setLater(e.target.checked);
                              changed();
                            }}
                          />
                          I will submit this later from my dashboard
                        </label>
                      </>
                    )}
                    {step === 6 && (
                      <>
                        <div id="field-agreement" tabIndex={-1}>
                          <div
                            className="application-agreement"
                            data-lenis-prevent
                            ref={agreementBox}
                            onScroll={(e) => {
                              const el = e.currentTarget;
                              if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8)
                                setReadEnd(true);
                            }}
                          >
                            {data.template
                              ? <HiringRichText text={fillAgreement(
                                  data.template.body,
                                  candidate.full_name,
                                  data.job.title,
                                  application?.public_code ?? "",
                                  today ?? new Date(data.job.created_at),
                                )} />
                              : "The agreement is not available yet."}
                          </div>
                          <p className="application-hint">
                            {readEnd
                              ? "You have reached the end."
                              : "Please read to the end to continue"}
                          </p>
                          {errors["agreement"] && (
                            <p className="application-error">{errors["agreement"]}</p>
                          )}
                        </div>
                        <div className="application-terms">
                          {termsList.map((term) => (
                            <label className="application-check" key={term}>
                              <input
                                type="checkbox"
                                disabled={!readEnd}
                                checked={terms.includes(term)}
                                onChange={(e) =>
                                  setTerms((old) =>
                                    e.target.checked
                                      ? [...old, term]
                                      : old.filter((t) => t !== term),
                                  )
                                }
                              />
                              {term}
                            </label>
                          ))}
                        </div>
                        <div id="field-signature" tabIndex={-1}>
                          <label>Your signature *</label>
                          {currentSignatureValid && signatureUrl && (
                            <img
                              className="application-signed-image"
                              src={signatureUrl}
                              alt="Saved signature"
                            />
                          )}
                          <ApplicationSignature onChange={setSignature} />
                          {errors["signature"] && (
                            <p className="application-error">{errors["signature"]}</p>
                          )}
                        </div>
                        <div id="field-signedName" tabIndex={-1}>
                          <label>
                            Type your full name to confirm
                            <input
                              autoComplete="name"
                              maxLength={100}
                              value={signedName}
                              onChange={(e) => setSignedName(e.target.value)}
                            />
                          </label>
                          {errors["signedName"] && (
                            <p className="application-error">{errors["signedName"]}</p>
                          )}
                        </div>
                      </>
                    )}
                    {step === 7 && (
                      <>
                        {reviewGroup(
                          2,
                          <dl>
                            {Object.entries(personalLabels).map(([key, label]) => (
                              <div key={key}>
                                <dt>{label}</dt>
                                <dd>{candidate[key as keyof CandidateFields] || "Not provided"}</dd>
                              </div>
                            ))}
                            <dt>Photo</dt>
                            <dd>
                              {photoUrl ? (
                                <img width={56} height={56} src={photoUrl} alt="Your passport photo" />
                              ) : (
                                "Not provided"
                              )}
                            </dd>
                          </dl>,
                        )}
                        {[3, 4].map((n) =>
                          reviewGroup(
                            n,
                            <dl>
                              {data.questions
                                .filter((q) => questionStep(q) === n)
                                .map((q) => (
                                  <div key={q.id}>
                                    <dt>{q.label}</dt>
                                    <dd>
                                      {Array.isArray(answers[q.id])
                                        ? (answers[q.id] as string[]).join(", ")
                                        : String(answers[q.id] ?? "Not provided")}
                                    </dd>
                                  </div>
                                ))}
                              {n === 4 && (
                                <>
                                  <dt>CV</dt>
                                  <dd>{cvPath ? cvName || "cv.pdf" : "Not provided"}</dd>
                                </>
                              )}
                            </dl>,
                          ),
                        )}
                        {data.job.task_enabled ? (
                          reviewGroup(
                            5,
                            <dl>
                              <dt>Task link</dt>
                              <dd>{later ? "Will submit later" : taskUrl || "Not provided"}</dd>
                              {data.questions
                                .filter((q) => questionStep(q) === 5)
                                .map((q) => (
                                  <div key={q.id}>
                                    <dt>{q.label}</dt>
                                    <dd>{String(answers[q.id] ?? "Not provided")}</dd>
                                  </div>
                                ))}
                            </dl>,
                          )
                        ) : null}
                        {reviewGroup(
                          6,
                          <>
                            {signatureUrl && currentSignatureValid && (
                              <img
                                className="application-signed-image"
                                src={signatureUrl}
                                alt="Your signed agreement signature"
                              />
                            )}
                            <p>
                              {currentSignatureValid
                                ? signed?.signer_full_name
                                : "Your name changed. Please sign the agreement again."}
                            </p>
                            <ul>
                              {termsList.map((term) => (
                                <li className="application-hint" key={term}>
                                  {term}
                                </li>
                              ))}
                            </ul>
                          </>,
                        )}
                        <label className="application-check">
                          <input
                            type="checkbox"
                            checked={confirmed}
                            onChange={(e) => setConfirmed(e.target.checked)}
                          />
                          I confirm everything I have shared is true.
                        </label>
                      </>
                    )}
                    <p className="application-saved" role="status">
                      {saved}
                    </p>
                    <div className="application-actions">
                      <Button variant="ghost" className="application-back apply-save-close" type="button" disabled={busy} onClick={() => exit(true)}>Save and close</Button>
                      <div className="apply-navigation">
                      {step > 2 ? (
                        <Button
                          variant="ghost"
                          className="application-back"
                          type="button"
                          disabled={busy}
                          onClick={() => back(previousApplicationStep(step, data.job.task_enabled))}
                        >
                          <ArrowLeft />
                          Back
                        </Button>
                      ) : (
                        <span />
                      )}
                      {step < 7 ? (
                        <Button className="application-next" type="submit" disabled={busy}>
                          {busy ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <>
                              Next
                              <ArrowRight />
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          className="application-next"
                          type="button"
                          disabled={busy || !confirmed || !currentSignatureValid}
                          onClick={() =>
                            void run(async () => {
                              for (const n of [2, 3, 4])
                                if (!validate(n)) {
                                  setStep(n);
                                  return;
                                }
                              await serialized(7);
                              const app = appRef.current;
                              if (!app) return;
                              await submit({ data: { id: app.id, confirmed: true } });
                              submitted.current = true;
                              await navigate({
                                to: "/careers/$slug/apply/done",
                                params: { slug },
                                replace: true,
                              });
                            })
                          }
                        >
                          {busy ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <>
                              <Check />
                              Submit application
                            </>
                          )}
                        </Button>
                      )}
                      </div>
                    </div>
                  </form>
                ) : (
                  <Button variant="outline" onClick={() => void load()}>
                    Try again
                  </Button>
                )}
              </>
            )}
        </div>
      </div>
      {cropFile && <PassportCrop file={cropFile} onCancel={() => setCropFile(null)} onSave={file => { setPhoto(file); setPhotoUrl(URL.createObjectURL(file)); setCropFile(null); setErrors(old => ({ ...old, passport: '' })); changed(); }} />}
    </div>
  );
}
