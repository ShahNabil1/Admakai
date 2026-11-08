import { Link, useLocation, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { canEditSiteContent, readSiteContentAdmin } from '@/lib/site-content.functions';
import { siteCatalogueQueryKey } from '@/lib/site-catalogue-query';
import { Empty } from '../ui';
import { ServicesTab } from './ServicesTab';
import { PlansTab } from './PlansTab';
import '../work-admin.css';
import './site-content.css';

export const siteContentAdminKey = ['site-content-admin'] as const;
export type AdminData = Awaited<ReturnType<typeof readSiteContentAdmin>>;

/** Shared refresh after any save: admin rows plus the public catalogue cache. */
export function useRefreshSiteContent() {
  const queryClient = useQueryClient();
  return () => Promise.all([
    queryClient.invalidateQueries({ queryKey: siteContentAdminKey }),
    queryClient.invalidateQueries({ queryKey: siteCatalogueQueryKey }),
  ]);
}

export function SiteContent() {
  const location = useLocation();
  const isPlans = location.pathname.startsWith('/admin/site-content/plans');
  const search = useSearch({ strict: false }) as { item?: string };
  const navigate = useNavigate();
  const check = useServerFn(canEditSiteContent);
  const read = useServerFn(readSiteContentAdmin);
  const access = useQuery({ queryKey: ['site-content-access'], queryFn: () => check(), staleTime: 60_000 });
  const data = useQuery({ queryKey: siteContentAdminKey, queryFn: () => read(), enabled: access.data === true });
  const openItem = (item: string | null) => void navigate({ to: isPlans ? '/admin/site-content/plans' : '/admin/site-content', search: item ? { item } : {} });

  if (access.isPending) return <div className="admin-skeleton" />;
  if (access.data !== true) return <Empty title="You do not have access" hint="Only owners and hiring admins can edit site content." />;
  return <section className="sc-page">
    {!search.item && <>
      <header className="admin-head"><div><p className="admin-eyebrow">Public website</p><h1>Site content</h1></div></header>
      <nav className="admin-chips sc-tabs" aria-label="Site content sections">
        <Link to="/admin/site-content" className={!isPlans ? 'is-active' : ''} aria-current={!isPlans ? 'page' : undefined}>Services</Link>
        <Link to="/admin/site-content/plans" className={isPlans ? 'is-active' : ''} aria-current={isPlans ? 'page' : undefined}>Plans</Link>
        <Link to="/admin/offers">Offers</Link>
      </nav>
    </>}
    {data.isPending ? <div className="admin-skeleton" /> : data.error ? <Empty title="Site content could not load" hint="Please refresh the page." /> : data.data && (isPlans
      ? <PlansTab data={data.data} item={search.item ?? null} openItem={openItem} />
      : <ServicesTab data={data.data} item={search.item ?? null} openItem={openItem} />)}
  </section>;
}
