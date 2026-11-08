CREATE OR REPLACE FUNCTION public.can_edit_site_content()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'owner')
    OR EXISTS (SELECT 1 FROM public.hiring_user_roles WHERE user_id = auth.uid() AND role = 'admin'::public.app_role))
$$;
REVOKE ALL ON FUNCTION public.can_edit_site_content() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_edit_site_content() TO authenticated, service_role;

CREATE TABLE public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) <= 80),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  intro text NOT NULL DEFAULT '' CHECK (length(intro) <= 400),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) <= 120),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 160),
  category text NOT NULL REFERENCES public.service_categories(slug) ON UPDATE CASCADE ON DELETE RESTRICT,
  short_description text NOT NULL DEFAULT '' CHECK (length(short_description) <= 600),
  full_description text NOT NULL DEFAULT '' CHECK (length(full_description) <= 8000),
  deliverables text[] NOT NULL DEFAULT '{}',
  process_steps jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(process_steps) = 'array'),
  faqs jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(faqs) = 'array'),
  price_min numeric(12,2) NOT NULL CHECK (price_min >= 0),
  price_max numeric(12,2) NOT NULL,
  price_unit text NOT NULL CHECK (length(btrim(price_unit)) BETWEEN 1 AND 60),
  base_currency text NOT NULL DEFAULT 'USD' CHECK (base_currency = 'USD'),
  pricing_model text NOT NULL DEFAULT 'quote' CHECK (pricing_model IN ('quote','per-minute','monthly')),
  is_published boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  is_new boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  seo_title text CHECK (seo_title IS NULL OR length(seo_title) <= 160),
  seo_description text CHECK (seo_description IS NULL OR length(seo_description) <= 320),
  best_for text[] NOT NULL DEFAULT '{}',
  signs_you_need_it text[] NOT NULL DEFAULT '{}',
  what_we_need text[] NOT NULL DEFAULT '{}',
  formats text NOT NULL DEFAULT '',
  delivery text NOT NULL DEFAULT '',
  goals text[] NOT NULL DEFAULT '{}',
  related text[] NOT NULL DEFAULT '{}',
  compare_note text,
  hero_title jsonb NOT NULL DEFAULT '{"lead":"","accent":"","rest":""}'::jsonb CHECK (jsonb_typeof(hero_title) = 'object'),
  hero_media jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (price_max >= price_min)
);
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) <= 80),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  tagline text NOT NULL DEFAULT '' CHECK (length(tagline) <= 200),
  badge text NOT NULL DEFAULT '' CHECK (length(badge) <= 60),
  is_highlighted boolean NOT NULL DEFAULT false,
  price_min numeric(12,2) NOT NULL CHECK (price_min >= 0),
  price_max numeric(12,2) NOT NULL,
  base_currency text NOT NULL DEFAULT 'USD' CHECK (base_currency = 'USD'),
  billing_period text NOT NULL DEFAULT 'month' CHECK (billing_period = 'month'),
  videos integer NOT NULL DEFAULT 0 CHECK (videos >= 0),
  statics integer NOT NULL DEFAULT 0 CHECK (statics >= 0),
  revision_rounds integer NOT NULL DEFAULT 0 CHECK (revision_rounds >= 0),
  turnaround_days integer NOT NULL DEFAULT 0 CHECK (turnaround_days >= 0),
  turnaround text NOT NULL DEFAULT '',
  calls text NOT NULL DEFAULT '',
  features text[] NOT NULL DEFAULT '{}',
  cta_text text NOT NULL DEFAULT 'Start with a call' CHECK (length(btrim(cta_text)) BETWEEN 1 AND 60),
  is_published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (price_max >= price_min)
);

REVOKE ALL ON public.service_categories, public.services, public.plans FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.service_categories, public.services, public.plans TO anon, authenticated;
GRANT INSERT, UPDATE ON public.services, public.plans TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.service_categories TO authenticated;
GRANT ALL ON public.service_categories, public.services, public.plans TO service_role;

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY site_categories_read ON public.service_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY site_categories_insert ON public.service_categories FOR INSERT TO authenticated WITH CHECK (public.can_edit_site_content());
CREATE POLICY site_categories_update ON public.service_categories FOR UPDATE TO authenticated USING (public.can_edit_site_content()) WITH CHECK (public.can_edit_site_content());
CREATE POLICY site_categories_delete ON public.service_categories FOR DELETE TO authenticated USING (public.can_edit_site_content());

CREATE POLICY site_services_public_read ON public.services FOR SELECT TO anon USING (is_published);
CREATE POLICY site_services_read ON public.services FOR SELECT TO authenticated USING (is_published OR public.can_edit_site_content());
CREATE POLICY site_services_insert ON public.services FOR INSERT TO authenticated WITH CHECK (public.can_edit_site_content());
CREATE POLICY site_services_update ON public.services FOR UPDATE TO authenticated USING (public.can_edit_site_content()) WITH CHECK (public.can_edit_site_content());

CREATE POLICY site_plans_public_read ON public.plans FOR SELECT TO anon USING (is_published);
CREATE POLICY site_plans_read ON public.plans FOR SELECT TO authenticated USING (is_published OR public.can_edit_site_content());
CREATE POLICY site_plans_insert ON public.plans FOR INSERT TO authenticated WITH CHECK (public.can_edit_site_content());
CREATE POLICY site_plans_update ON public.plans FOR UPDATE TO authenticated USING (public.can_edit_site_content()) WITH CHECK (public.can_edit_site_content());

CREATE TRIGGER site_categories_touch BEFORE UPDATE ON public.service_categories FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER site_services_touch BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER site_plans_touch BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Append-only audit: one activity row per save naming every changed field, with price before/after.
CREATE OR REPLACE FUNCTION public.log_site_content()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE actor uuid := auth.uid(); o jsonb; n jsonb; fields text[];
BEGIN
  IF current_setting('app.site_content_reorder', true) = 'on' THEN RETURN NULL; END IF;
  IF actor IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = actor) THEN actor := NULL; END IF;
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity(entity_type, entity_id, actor_id, verb, meta)
    VALUES (TG_TABLE_NAME, OLD.id, actor, 'deleted', jsonb_build_object('title', OLD.name, 'slug', OLD.slug));
    RETURN NULL;
  END IF;
  n := to_jsonb(NEW) - 'updated_at' - 'created_at';
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity(entity_type, entity_id, actor_id, verb, meta)
    VALUES (TG_TABLE_NAME, NEW.id, actor, 'created', jsonb_build_object('title', NEW.name, 'slug', n->>'slug'));
    RETURN NULL;
  END IF;
  o := to_jsonb(OLD) - 'updated_at' - 'created_at';
  SELECT array_agg(k ORDER BY k) INTO fields FROM jsonb_object_keys(n) k WHERE o->k IS DISTINCT FROM n->k;
  IF fields IS NULL THEN RETURN NULL; END IF;
  INSERT INTO public.activity(entity_type, entity_id, actor_id, verb, from_value, to_value, meta)
  VALUES (TG_TABLE_NAME, NEW.id, actor, 'updated',
    CASE WHEN o ? 'price_min' AND (o->>'price_min' IS DISTINCT FROM n->>'price_min' OR o->>'price_max' IS DISTINCT FROM n->>'price_max') THEN (o->>'price_min')||' to '||(o->>'price_max') END,
    CASE WHEN o ? 'price_min' AND (o->>'price_min' IS DISTINCT FROM n->>'price_min' OR o->>'price_max' IS DISTINCT FROM n->>'price_max') THEN (n->>'price_min')||' to '||(n->>'price_max') END,
    jsonb_build_object('title', NEW.name, 'slug', n->>'slug', 'fields', to_jsonb(fields)));
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.log_site_content() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER site_categories_activity AFTER INSERT OR UPDATE OR DELETE ON public.service_categories FOR EACH ROW EXECUTE FUNCTION public.log_site_content();
CREATE TRIGGER site_services_activity AFTER INSERT OR UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.log_site_content();
CREATE TRIGGER site_plans_activity AFTER INSERT OR UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.log_site_content();

-- Reorder in one transaction with a single audit row instead of one per moved item.
CREATE OR REPLACE FUNCTION public.site_content_reorder(_kind text, _ids uuid[])
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE changed integer := 0; actor uuid := auth.uid();
BEGIN
  IF NOT public.can_edit_site_content() THEN RAISE EXCEPTION 'Only site content editors can reorder' USING ERRCODE = '42501'; END IF;
  IF _kind NOT IN ('services','plans','service_categories') OR _ids IS NULL OR cardinality(_ids) = 0 OR cardinality(_ids) > 500 THEN RAISE EXCEPTION 'Invalid reorder request'; END IF;
  PERFORM set_config('app.site_content_reorder', 'on', true);
  EXECUTE format('UPDATE public.%I t SET sort_order = x.ord FROM unnest($1) WITH ORDINALITY AS x(id, ord) WHERE t.id = x.id AND t.sort_order IS DISTINCT FROM x.ord', _kind) USING _ids;
  GET DIAGNOSTICS changed = ROW_COUNT;
  PERFORM set_config('app.site_content_reorder', 'off', true);
  IF actor IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = actor) THEN actor := NULL; END IF;
  IF changed > 0 THEN
    INSERT INTO public.activity(entity_type, entity_id, actor_id, verb, meta)
    VALUES (_kind, _ids[1], actor, 'reordered', jsonb_build_object('title', 'Display order', 'count', changed));
  END IF;
  RETURN changed;
END $$;
REVOKE ALL ON FUNCTION public.site_content_reorder(text, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.site_content_reorder(text, uuid[]) TO authenticated;