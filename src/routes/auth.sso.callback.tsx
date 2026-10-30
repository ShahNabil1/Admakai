import { useEffect, useRef, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { seoHead } from '@/lib/seo';
import { supabase } from '@/lib/supabase';
import { clearSsoState, readSsoState, ssoResultMessage, isStaffRole, parseSsoFragment, startHubSignIn } from '@/lib/sso';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/auth/sso/callback')({
  ssr: false,
  head: () => seoHead({ title: 'Signing in | Admakai', description: 'Completing Branta Hub sign-in.', path: '/auth/sso/callback', noindex: true }),
  component: SsoCallback,
});

function SsoCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const saved = readSsoState();
    const parsed = parseSsoFragment(window.location.hash, saved?.state ?? null);
    history.replaceState(null, '', window.location.pathname);
    clearSsoState();
    const finish = (failure?: string) => {
      if (saved?.mode === 'popup' && window.opener && !window.opener.closed) {
        window.opener.postMessage(ssoResultMessage(saved.state, !failure, failure), window.location.origin);
        if (failure) setError(failure); else setCompleted(true);
        window.close();
      } else if (failure) setError(failure);
      else void navigate({ to: '/admin', replace: true });
    };
    if ('error' in parsed) { finish(parsed.error); return; }
    (async () => {
      try {
      const { data, error: e } = await supabase.auth.setSession({ access_token: parsed.access_token, refresh_token: parsed.refresh_token });
      if (e || !data.user) { finish('Could not start your session.'); return; }
      const { data: r } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).maybeSingle();
      if (!isStaffRole(r?.role)) { await supabase.auth.signOut(); finish('Your Branta account does not have Admakai access.'); return; }
      finish();
      } catch {
        await supabase.auth.signOut().catch(() => undefined);
        finish('Could not verify your Branta account. Please try again.');
      }
    })();
  }, [navigate]);
  return (
    <main className="admin-center">
      <div className="admin-card">
        <h1>{error ? 'Sign-in failed' : completed ? 'You’re signed in' : 'Signing you in…'}</h1>
        <p>{error ?? (completed ? "You're signed in — you can close this window." : 'Verifying your Branta Hub account.')}</p>
        {error && (window.opener
          ? <Button className="admin-btn" onClick={() => window.close()}>Close window</Button>
          : <Button className="admin-btn" onClick={startHubSignIn}>Try again</Button>)}
      </div>
    </main>
  );
}
