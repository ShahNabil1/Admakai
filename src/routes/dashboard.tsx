import { createFileRoute, redirect } from '@tanstack/react-router';
import { supabase } from '@/lib/supabase';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { ClientSkeleton } from '@/components/client/ClientSkeleton';
export const Route = createFileRoute('/dashboard')({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: '/signin', search: { redirect: location.href } });
  },
  pendingComponent: ClientSkeleton,
  component: DashboardShell,
});
