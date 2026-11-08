import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

type AuthState = { user: User | null; ready: boolean; signOut: () => Promise<void> };
const AuthContext = createContext<AuthState>({ user: null, ready: false, signOut: async () => {} });

/** The one auth listener for the whole app. Pages read `useAuth()` instead of subscribing themselves. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const cache = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const current = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    const apply = (next: User | null, identityEvent: boolean) => {
      const changed = (next?.id ?? null) !== current.current;
      current.current = next?.id ?? null;
      setUser(next);
      setReady(true);
      if (!identityEvent && !changed) return;
      queueMicrotask(() => {
        if (!next) void cache.cancelQueries().then(() => cache.clear());
        else void cache.invalidateQueries();
        void router.invalidate();
      });
    };
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      current.current = data.user?.id ?? null;
      setUser(data.user ?? null);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') apply(session?.user ?? null, event !== 'SIGNED_IN' || (session?.user?.id ?? null) !== current.current);
      else if (event === 'TOKEN_REFRESHED' && session?.user) setUser(session.user);
    });
    // Another tab signed in or out: re-read the stored session so the header updates live.
    const onStorage = (e: StorageEvent) => {
      if (!e.key || !/^sb-.*-auth-token$/.test(e.key)) return;
      void supabase.auth.getSession().then(({ data: s }) => { if (active) apply(s.session?.user ?? null, false); });
    };
    window.addEventListener('storage', onStorage);
    return () => { active = false; data.subscription.unsubscribe(); window.removeEventListener('storage', onStorage); };
  }, [router, cache]);

  const signOut = useCallback(async () => {
    await cache.cancelQueries();
    cache.clear();
    await supabase.auth.signOut();
    await router.navigate({ to: '/', replace: true });
  }, [cache, router]);

  const value = useMemo(() => ({ user, ready, signOut }), [user, ready, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Owner (protected user_roles) or hiring staff — the same check the admin guard uses. */
export async function isStaffAccount(userId: string) {
  const [{ data: role }, { data: hiring, error }] = await Promise.all([
    supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
    supabase.rpc('is_hiring_staff', { _user_id: userId }),
  ]);
  return role?.role === 'owner' || (!error && hiring === true);
}
