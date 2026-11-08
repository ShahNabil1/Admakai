import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowUpRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApplicationSignIn } from '@/components/careers/ApplicationSignIn';
import { supabase } from '@/lib/supabase';
import { safeReturnPath, signedInHome } from '@/lib/account-rules';
import { isStaffAccount, useAuth } from '@/lib/auth-state';
import { isOtp, normalizeOtp, passwordError, PASSWORD_MAX, PASSWORD_MIN } from '@/lib/auth-rules';
import { seoHead } from '@/lib/seo';
import '@/components/client/client-area.css';
import '@/components/careers/application.css';

export const Route = createFileRoute('/signin')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => { const r = safeReturnPath(search['redirect']); return r ? { redirect: r } : {}; },
  head: () => seoHead({ title: 'Sign In | Admakai', description: 'Sign in to Admakai with Google or a one-time email code.', path: '/signin', noindex: true }),
  component: SignIn,
});

type Mode = 'code' | 'signin' | 'verify' | 'forgot' | 'reset';

const friendly = (reason: unknown, fallback: string) => {
  const msg = reason instanceof Error ? reason.message : '';
  if (/invalid login credentials/i.test(msg)) return 'Email or password is incorrect.';
  if (/email not confirmed/i.test(msg)) return 'Please confirm your email first. We sent you a 6-digit code.';
  if (/expired|invalid.*(otp|token)|token.*(expired|invalid)/i.test(msg)) return 'That code is wrong or has expired. Request a new one.';
  if (/rate limit|security purposes|too many/i.test(msg)) return 'Too many attempts. Please wait a minute and try again.';
  if (/same.*password|different from the old/i.test(msg)) return 'You can’t reuse a password you used before. Choose a new one.';
  return msg || fallback;
};

function PasswordInput({ id, value, onChange, autoComplete }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return <div className="auth-password">
    <input id={id} type={show ? 'text' : 'password'} autoComplete={autoComplete} required minLength={PASSWORD_MIN} maxLength={PASSWORD_MAX} value={value} onChange={e => onChange(e.target.value)} />
    <button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(s => !s)}>{show ? <EyeOff /> : <Eye />}</button>
  </div>;
}

function SignIn() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('code');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [resetVerified, setResetVerified] = useState(false);

  const cleanEmail = email.trim().toLowerCase();
  const { user, ready } = useAuth();
  const userId = user?.id;
  const leave = async (id: string) => { const staff = redirect ? false : await isStaffAccount(id).catch(() => false); await navigate({ href: signedInHome(staff, redirect), replace: true }); };

  // Shared auth state: once a session exists (Google return, email code, password), go on.
  useEffect(() => {
    if (!ready || !userId || mode === 'reset') return;
    let active = true;
    void (async () => { if (active) await leave(userId); })();
    return () => { active = false; };
  }, [ready, userId, mode]);
  useEffect(() => { if (!seconds) return; const t = setTimeout(() => setSeconds(n => Math.max(n - 1, 0)), 1000); return () => clearTimeout(t); }, [seconds]);

  const go = (next: Mode) => { setMode(next); setError(''); setNotice(''); setCode(''); setPassword(''); setConfirm(''); setResetVerified(false); };
  const run = async (fn: () => Promise<void>, fallback: string) => {
    if (busy) return; setBusy(true); setError(''); setNotice('');
    try { await fn(); } catch (reason) { setError(friendly(reason, fallback)); } finally { setBusy(false); }
  };

  const signInPassword = (e: FormEvent) => { e.preventDefault(); void run(async () => {
    const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) { if (/email not confirmed/i.test(error.message)) { await supabase.auth.resend({ type: 'signup', email: cleanEmail }); setMode('verify'); setSeconds(60); setNotice('Your email isn’t confirmed yet. We sent a new 6-digit code.'); return; } throw error; }
  }, 'Sign-in failed. Please try again.'); };

  const verifySignup = (e: FormEvent) => { e.preventDefault(); void run(async () => {
    if (!isOtp(code)) throw new Error('Enter the 6-digit code from your email.');
    const { error } = await supabase.auth.verifyOtp({ email: cleanEmail, token: code, type: 'signup' });
    if (error) throw error;
  }, 'Verification failed.'); };

  const sendReset = (e?: FormEvent) => { e?.preventDefault(); if (seconds) return; void run(async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
    if (error) throw error;
    setMode('reset'); setCode(''); setResetVerified(false); setSeconds(60); setNotice(`If an account exists for ${cleanEmail}, a 6-digit code is on its way.`);
  }, 'The code could not be sent.'); };

  const resend = () => { if (seconds) return; void run(async () => {
    const { error } = mode === 'verify' ? await supabase.auth.resend({ type: 'signup', email: cleanEmail }) : await supabase.auth.resetPasswordForEmail(cleanEmail);
    if (error) throw error; setSeconds(60); setNotice('A new code has been sent.');
  }, 'The code could not be sent.'); };

  const resetPassword = (e: FormEvent) => { e.preventDefault(); void run(async () => {
    if (!resetVerified) {
      if (!isOtp(code)) throw new Error('Enter the 6-digit code from your email.');
      const { error } = await supabase.auth.verifyOtp({ email: cleanEmail, token: code, type: 'recovery' });
      if (error) throw error;
      setResetVerified(true); setNotice('Code confirmed. Now choose a new password.'); return;
    }
    const pe = passwordError(password); if (pe) throw new Error(pe);
    if (password !== confirm) throw new Error('Passwords don’t match.');
    const { data: used, error: checkError } = await supabase.rpc('password_previously_used', { p_password: password });
    if (checkError) throw new Error('We couldn’t check your password right now. Please try again.');
    if (used) throw new Error('You can’t reuse your current or a previous password. Choose a new one.');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    if (user) await leave(user.id);
  }, 'Password could not be changed.'); };

  const title = { code: 'Sign in to Admakai', signin: 'Sign in with password', verify: 'Confirm your email', forgot: 'Forgot password', reset: resetVerified ? 'Set a new password' : 'Enter your code' }[mode];
  const Icon = mode === 'code' ? LogIn : mode === 'verify' ? Mail : mode === 'signin' ? LockKeyhole : ShieldCheck;
  const lengthHint = <p className="client-small auth-hint">{PASSWORD_MIN} to {PASSWORD_MAX} characters.</p>;
  const codeField = <><label htmlFor="auth-code">6-digit code</label><input id="auth-code" className="auth-otp" inputMode="numeric" autoComplete="one-time-code" placeholder="••••••" value={code} onChange={e => setCode(normalizeOtp(e.target.value))} /></>;
  const resendButton = <Button type="button" variant="link" className="client-text-button auth-resend" disabled={!!seconds || busy} onClick={resend}>{seconds ? `Resend code in ${seconds}s` : 'Resend code'}</Button>;

  if (mode === 'code') return <main className="apply-auth-page"><ApplicationSignIn returnPath={redirect ?? '/dashboard'} onSignedIn={() => undefined}>
    <div className="signin-links"><Button type="button" variant="link" className="application-back" onClick={() => go('signin')}>Sign in with password instead</Button><a className="auth-link" href="/admin">Team member? Sign in with Branta Console</a></div>
  </ApplicationSignIn></main>;
  return <main className="client-signin"><section className="client-signin-card">
    <span className="client-signin-icon"><Icon /></span>
    <h1>{title}</h1>

    {mode === 'signin' && <form onSubmit={signInPassword}>
      <label htmlFor="auth-email">Email</label><input id="auth-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
      <div className="auth-label-row"><label htmlFor="auth-password">Password</label><button type="button" className="auth-link" onClick={() => go('forgot')}>Forgot password?</button></div>
      <PasswordInput id="auth-password" value={password} onChange={setPassword} autoComplete="current-password" />
      <Button className="client-dark-button" type="submit" disabled={busy || !cleanEmail || !password}>{busy ? 'Signing in…' : 'Sign in'}<ArrowUpRight /></Button>
      <div className="auth-foot"><button type="button" className="auth-link" onClick={() => go('code')}>Use Google or an email code</button></div>
    </form>}

    {mode === 'verify' && <form onSubmit={verifySignup}>
      <p>Enter the 6-digit code we sent to <strong>{cleanEmail}</strong>. Check spam if it hasn’t arrived.</p>
      {codeField}
      <Button className="client-dark-button" type="submit" disabled={busy || !isOtp(code)}>{busy ? 'Checking…' : 'Confirm email'}<ArrowUpRight /></Button>
      <div className="auth-foot">{resendButton}<button type="button" className="auth-link" onClick={() => go('signin')}>Change email</button></div>
    </form>}

    {mode === 'forgot' && <form onSubmit={sendReset}>
      <p>Enter your account email. We’ll send a 6-digit code to reset your password.</p>
      <label htmlFor="auth-email">Email</label><input id="auth-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
      <Button className="client-dark-button" type="submit" disabled={busy || !cleanEmail}>{busy ? 'Sending…' : 'Send code'}<ArrowUpRight /></Button>
      <div className="auth-foot"><button type="button" className="auth-link" onClick={() => go('signin')}>Back to sign in</button></div>
    </form>}

    {mode === 'reset' && <form onSubmit={resetPassword}>
      {!resetVerified ? <>
        <p>Enter the 6-digit code sent to <strong>{cleanEmail}</strong>.</p>
        {codeField}
        <Button className="client-dark-button" type="submit" disabled={busy || !isOtp(code)}>{busy ? 'Checking…' : 'Verify code'}<ArrowUpRight /></Button>
        <div className="auth-foot">{resendButton}<button type="button" className="auth-link" onClick={() => go('signin')}>Back to sign in</button></div>
      </> : <>
        <p>Your new password can’t be your current or a previously used password.</p>
        <label htmlFor="auth-password">New password</label><PasswordInput id="auth-password" value={password} onChange={setPassword} autoComplete="new-password" />{lengthHint}
        <label htmlFor="auth-confirm">Confirm new password</label><PasswordInput id="auth-confirm" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        <Button className="client-dark-button" type="submit" disabled={busy || !password || !confirm}>{busy ? 'Saving…' : 'Save new password'}<ArrowUpRight /></Button>
      </>}
    </form>}

    {notice && <p role="status" className="auth-notice">{notice}</p>}
    {error && <p role="alert" className="client-error auth-error">{error}</p>}
  </section></main>;
}
