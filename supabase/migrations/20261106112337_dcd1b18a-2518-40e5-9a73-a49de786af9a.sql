CREATE TABLE public.work_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
GRANT SELECT ON public.work_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.work_categories TO authenticated;
GRANT ALL ON public.work_categories TO service_role;
ALTER TABLE public.work_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY work_categories_read ON public.work_categories FOR SELECT USING (true);
CREATE POLICY work_categories_create ON public.work_categories FOR INSERT TO authenticated WITH CHECK (app.is_manager());
CREATE POLICY work_categories_edit ON public.work_categories FOR UPDATE TO authenticated USING (app.is_manager()) WITH CHECK (app.is_manager());
CREATE POLICY work_categories_remove ON public.work_categories FOR DELETE TO authenticated USING (app.is_manager());

CREATE TABLE public.works (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  vimeo_id text not null,
  aspect text not null default '16:9' check (aspect in ('16:9','9:16','1:1','4:5')),
  duration_sec int,
  thumbnail_url text,
  category_id uuid references public.work_categories(id) on delete set null,
  client_name text,
  industry text,
  year int,
  short_description text,
  tags text[] not null default '{}',
  featured boolean not null default false,
  published boolean not null default true,
  sort_order int not null default 0,
  case_study jsonb not null default '{}'::jsonb,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT ON public.works TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.works TO authenticated;
GRANT ALL ON public.works TO service_role;
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;
CREATE POLICY works_read ON public.works FOR SELECT USING (published OR app.is_manager());
CREATE POLICY works_create ON public.works FOR INSERT TO authenticated WITH CHECK (app.is_manager());
CREATE POLICY works_edit ON public.works FOR UPDATE TO authenticated USING (app.is_manager()) WITH CHECK (app.is_manager());
CREATE POLICY works_remove ON public.works FOR DELETE TO authenticated USING (app.is_manager());
CREATE INDEX works_category_idx ON public.works (category_id);
CREATE INDEX works_published_idx ON public.works (published);
CREATE INDEX works_featured_sort_idx ON public.works (featured desc, sort_order);
CREATE TRIGGER works_touch_updated_at BEFORE UPDATE ON public.works FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.work_services (
  work_id uuid not null references public.works(id) on delete cascade,
  service_slug text not null,
  position int not null default 0,
  primary key (work_id, service_slug)
);
GRANT SELECT ON public.work_services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.work_services TO authenticated;
GRANT ALL ON public.work_services TO service_role;
ALTER TABLE public.work_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY work_services_read ON public.work_services FOR SELECT USING (EXISTS (SELECT 1 FROM public.works w WHERE w.id = work_id AND w.published) OR app.is_manager());
CREATE POLICY work_services_create ON public.work_services FOR INSERT TO authenticated WITH CHECK (app.is_manager());
CREATE POLICY work_services_edit ON public.work_services FOR UPDATE TO authenticated USING (app.is_manager()) WITH CHECK (app.is_manager());
CREATE POLICY work_services_remove ON public.work_services FOR DELETE TO authenticated USING (app.is_manager());
CREATE INDEX work_services_service_idx ON public.work_services (service_slug, position);