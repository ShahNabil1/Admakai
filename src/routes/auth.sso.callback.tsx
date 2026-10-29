import { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { seoHead } from '@/lib/seo';
import { supabase } from '@/lib/supabase';
import { SSO_STATE_KEY, isStaffRole, parseSsoFragment, startHubSignIn } from '@/lib/sso';

export const Route = createFileRoute('/auth/sso/callback')({
  ssr: false,
  head: () => seoHead({ title: 'Signing in | Admakai', description: 'Completing Branta Hub sign-in.', path: '/auth/sso/callback', noindex: true }),
  component: SsoCallback,
});

function SsoCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const expected = sessionStorage.getItem(SSO_STATE_KEY);
    sessionStorage.removeItem(SSO_STATE_KEY);
    const parsed = parseSsoFragment(window.location.hash, expected);
    history.replaceState(null, '', window.location.pathname);
    if ('error' in parsed) { setError(parsed.error); return; }
    (async () => {
      const { data, error: e } = await supabase.auth.setSession({ access_token: parsed.access_token, refresh_token: parsed.refresh_token });
      if (e || !data.user) { setError('Could not start your session.'); return; }
      const { data: r } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).maybeSingle();
      if (!isStaffRole(r?.role)) { await supabase.auth.signOut(); setError('Your Branta account does not have Admakai access.'); return; }
      navigate({ to: '/admin', replace: true });
    })();
  }, [navigate]);
  return (
    <main className="admin-center">
      <div className="admin-card">
        <h1>{error ? 'Sign-in failed' : 'Signing you in…'}</h1>
        <p>{error ?? 'Verifying your Branta Hub account.'}</p>
        {error && <button className="admin-btn" onClick={startHubSignIn}>Try again</button>}
      </div>
    </main>
  );
}
