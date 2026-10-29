import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowUpRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InternationalPhoneField } from '@/components/public/InternationalPhoneField';
import { supabase } from '@/lib/supabase';
import { safeAppPath } from '@/lib/client-rules';
import { internationalPhone } from '@/lib/international-phone';
import { isOtp, normalizeOtp, passwordError, PASSWORD_MAX, PASSWORD_MIN } from '@/lib/auth-rules';
import { seoHead } from '@/lib/seo';
import '@/components/client/client-area.css';

export const Route = createFileRoute('/signin')({
  validateSearch: (search: Record<string, unknown>) => ({ redirect: safeAppPath(search['redirect']) }),
  head: () => seoHead({ title: 'Sign In | Admakai', description: 'Sign in or create your Admakai client account.', path: '/signin', noindex: true }),
  component: SignIn,
});

type Mode = 'signin' | 'signup' | 'verify' | 'forgot' | 'reset';

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

function GoogleMark() {
  return <svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>;
}

function SignIn() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [resetVerified, setResetVerified] = useState(false);

  const destination = safeAppPath(redirect);
  const cleanEmail = email.trim().toLowerCase();

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => { if (data.user && mode !== 'reset') void navigate({ to: destination, replace: true }); });
    const { data } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_IN' && mode !== 'reset') void navigate({ to: destination, replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate, destination, mode]);
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

  const google = () => void run(async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/signin?redirect=${encodeURIComponent(destination)}` } });
    if (error) throw error;
  }, 'Google sign-in could not start.');

  const signUp = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const form = new FormData(e.currentTarget); void run(async () => {
    const whatsappRaw = String(form.get('whatsapp') ?? '');
    const phone = internationalPhone(whatsappRaw);
    if (name.trim().length < 2) throw new Error('Please enter your full name.');
    if (!phone) { setPhoneError('Enter a valid WhatsApp number.'); throw new Error('Enter a valid WhatsApp number.'); }
    const pe = passwordError(password); if (pe) throw new Error(pe);
    if (password !== confirm) throw new Error('Passwords don’t match.');
    const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password, options: { data: { full_name: name.trim(), whatsapp: phone.number } } });
    if (error) throw error;
    if (data.user && data.user.identities?.length === 0) throw new Error('An account with this email already exists. Please sign in.');
    if (data.session) return; // auto-confirmed projects sign in immediately
    setMode('verify'); setCode(''); setSeconds(60); setNotice(`We sent a 6-digit code to ${cleanEmail}.`);
  }, 'Sign-up failed. Please try again.'); };

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
    void navigate({ to: destination, replace: true });
  }, 'Password could not be changed.'); };

  const title = { signin: 'Sign in to Admakai', signup: 'Create your account', verify: 'Confirm your email', forgot: 'Forgot password', reset: resetVerified ? 'Set a new password' : 'Enter your code' }[mode];
  const Icon = mode === 'signup' ? UserRound : mode === 'verify' ? Mail : mode === 'signin' ? LockKeyhole : ShieldCheck;
  const lengthHint = <p className="client-small auth-hint">{PASSWORD_MIN}–{PASSWORD_MAX} characters.</p>;
  const codeField = <><label htmlFor="auth-code">6-digit code</label><input id="auth-code" className="auth-otp" inputMode="numeric" autoComplete="one-time-code" placeholder="••••••" value={code} onChange={e => setCode(normalizeOtp(e.target.value))} /></>;
  const resendButton = <Button type="button" variant="link" className="client-text-button auth-resend" disabled={!!seconds || busy} onClick={resend}>{seconds ? `Resend code in ${seconds}s` : 'Resend code'}</Button>;

  return <main className="client-signin"><section className="client-signin-card">
    <span className="client-signin-icon"><Icon /></span>
    <h1>{title}</h1>

    {(mode === 'signin' || mode === 'signup') && <>
      <div className="auth-tabs" role="tablist">
        <button role="tab" type="button" aria-selected={mode === 'signin'} onClick={() => go('signin')}>Sign in</button>
        <button role="tab" type="button" aria-selected={mode === 'signup'} onClick={() => go('signup')}>Sign up</button>
      </div>
      <Button type="button" variant="outline" className="auth-google" onClick={google} disabled={busy}><GoogleMark />Continue with Google</Button>
      <div className="auth-divider"><span>or with email</span></div>
    </>}

    {mode === 'signin' && <form onSubmit={signInPassword}>
      <label htmlFor="auth-email">Email</label><input id="auth-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
      <div className="auth-label-row"><label htmlFor="auth-password">Password</label><button type="button" className="auth-link" onClick={() => go('forgot')}>Forgot password?</button></div>
      <PasswordInput id="auth-password" value={password} onChange={setPassword} autoComplete="current-password" />
      <Button className="client-dark-button" type="submit" disabled={busy || !cleanEmail || !password}>{busy ? 'Signing in…' : 'Sign in'}<ArrowUpRight /></Button>
    </form>}

    {mode === 'signup' && <form onSubmit={signUp} noValidate>
      <label htmlFor="auth-name">Full name</label><input id="auth-name" autoComplete="name" required value={name} onChange={e => setName(e.target.value)} />
      <div className="auth-phone"><InternationalPhoneField error={phoneError || undefined} onChange={() => setPhoneError('')} /></div>
      {phoneError && <p className="client-error auth-field-error">{phoneError}</p>}
      <label htmlFor="auth-email">Email</label><input id="auth-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
      <label htmlFor="auth-password">Password</label><PasswordInput id="auth-password" value={password} onChange={setPassword} autoComplete="new-password" />{lengthHint}
      <label htmlFor="auth-confirm">Confirm password</label><PasswordInput id="auth-confirm" value={confirm} onChange={setConfirm} autoComplete="new-password" />
      <Button className="client-dark-button" type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}<ArrowUpRight /></Button>
    </form>}

    {mode === 'verify' && <form onSubmit={verifySignup}>
      <p>Enter the 6-digit code we sent to <strong>{cleanEmail}</strong>. Check spam if it hasn’t arrived.</p>
      {codeField}
      <Button className="client-dark-button" type="submit" disabled={busy || !isOtp(code)}>{busy ? 'Checking…' : 'Confirm email'}<ArrowUpRight /></Button>
      <div className="auth-foot">{resendButton}<button type="button" className="auth-link" onClick={() => go('signup')}>Change email</button></div>
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
