import { createFileRoute, redirect } from '@tanstack/react-router';
import { legacyAccountPath, safeReturnPath } from '@/lib/account-rules';
/** Old /app links keep working: they forward to the shared dashboard. */
export const Route = createFileRoute('/app')({
  beforeLoad: ({ location }) => {
    const to = legacyAccountPath(location.pathname) ?? '/dashboard';
    const back = (location.search as Record<string, unknown>)['redirect'];
    const mapped = typeof back === 'string' ? legacyAccountPath(back) ?? safeReturnPath(back) : undefined;
    if (to === '/signin') throw redirect({ to: '/signin', search: mapped ? { redirect: mapped } : {}, statusCode: 301 });
    throw redirect({ href: to, statusCode: 301 });
  },
});
