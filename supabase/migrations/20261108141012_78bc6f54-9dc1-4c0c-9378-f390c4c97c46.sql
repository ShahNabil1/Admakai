CREATE OR REPLACE FUNCTION site_private.valid_offer_theme(_theme jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path TO '' AS $$
  SELECT jsonb_typeof(_theme) = 'object' AND NOT EXISTS (
    SELECT 1 FROM jsonb_each(_theme) e
    WHERE e.key NOT IN ('background','text','accent','badge') OR jsonb_typeof(e.value) <> 'string' OR (e.value #>> '{}') !~ '^#[0-9A-Fa-f]{6}$')
$$;
REVOKE ALL ON FUNCTION site_private.valid_offer_theme(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION site_private.valid_offer_theme(jsonb) TO authenticated, service_role;

CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 80),
  preset text NOT NULL DEFAULT 'custom' CHECK (preset IN ('black_friday','eid','puja','pohela_boishakh','new_year','stock_out','flash_sale','always_on','custom')),
  headline text NOT NULL CHECK (char_length(btrim(headline)) BETWEEN 1 AND 160),
  short_badge text NOT NULL CHECK (char_length(btrim(short_badge)) BETWEEN 1 AND 40),
  discount_percent integer NOT NULL CHECK (discount_percent BETWEEN 1 AND 90),
  applies_to text NOT NULL DEFAULT 'everything' CHECK (applies_to IN ('everything','services','plans','selected')),
  selected_service_ids uuid[] NOT NULL DEFAULT '{}' CHECK (cardinality(selected_service_ids) <= 200),
  selected_plan_ids uuid[] NOT NULL DEFAULT '{}' CHECK (cardinality(selected_plan_ids) <= 50),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz CHECK (ends_at IS NULL OR ends_at > starts_at),
  is_active boolean NOT NULL DEFAULT false,
  priority integer NOT NULL DEFAULT 0 CHECK (priority BETWEEN -1000 AND 1000),
  show_bar boolean NOT NULL DEFAULT true,
  show_countdown boolean NOT NULL DEFAULT true,
  cta_text text NOT NULL DEFAULT 'Claim now' CHECK (char_length(btrim(cta_text)) BETWEEN 1 AND 40),
  cta_link text NOT NULL DEFAULT '/pricing' CHECK (cta_link ~ '^/[A-Za-z0-9/_?=&.#%+-]*$' AND cta_link !~ '^//' AND char_length(cta_link) <= 200),
  theme jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (site_private.valid_offer_theme(theme)),
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (applies_to = 'selected' OR (cardinality(selected_service_ids) = 0 AND cardinality(selected_plan_ids) = 0)),
  CHECK (applies_to <> 'selected' OR cardinality(selected_service_ids) + cardinality(selected_plan_ids) > 0)
);
CREATE INDEX offers_live_idx ON public.offers (is_active, starts_at, ends_at, priority DESC);

REVOKE ALL ON public.offers FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, slug, preset, headline, short_badge, discount_percent, applies_to, selected_service_ids, selected_plan_ids, starts_at, ends_at, is_active, priority, show_bar, show_countdown, cta_text, cta_link, theme, updated_at) ON public.offers TO anon;
GRANT SELECT, INSERT, UPDATE ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY offers_public_live_read ON public.offers FOR SELECT TO anon, authenticated
  USING (is_active AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now()));
CREATE POLICY offers_staff_read ON public.offers FOR SELECT TO authenticated
  USING (site_private.can_edit() OR (SELECT app.is_staff()));
CREATE POLICY offers_editor_insert ON public.offers FOR INSERT TO authenticated
  WITH CHECK (site_private.can_edit());
CREATE POLICY offers_editor_update ON public.offers FOR UPDATE TO authenticated
  USING (site_private.can_edit()) WITH CHECK (site_private.can_edit());

-- created_by always records the real editor; it never changes afterwards.
CREATE OR REPLACE FUNCTION site_private.offer_owner_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path TO '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF current_user IN ('anon','authenticated') THEN NEW.created_by := auth.uid(); END IF;
  ELSE
    NEW.created_by := OLD.created_by;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER offers_owner_guard BEFORE INSERT OR UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION site_private.offer_owner_guard();
CREATE TRIGGER offers_touch BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER offers_activity AFTER INSERT OR UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.log_site_content();

-- The offer a visitor saw: the live bar offer first, else the highest-priority live offer.
CREATE OR REPLACE FUNCTION site_private.live_offer_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
  SELECT o.id FROM public.offers o
  WHERE o.is_active AND o.starts_at <= now() AND (o.ends_at IS NULL OR o.ends_at > now())
  ORDER BY o.show_bar DESC, o.priority DESC, o.starts_at DESC, o.id
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION site_private.live_offer_id() FROM PUBLIC, anon, authenticated;

ALTER TABLE public.bookings ADD COLUMN offer_id uuid REFERENCES public.offers(id);
ALTER TABLE public.enquiries ADD COLUMN offer_id uuid REFERENCES public.offers(id);
CREATE INDEX bookings_offer_id_idx ON public.bookings (offer_id) WHERE offer_id IS NOT NULL;
CREATE INDEX enquiries_offer_id_idx ON public.enquiries (offer_id) WHERE offer_id IS NOT NULL;
GRANT SELECT (offer_id) ON public.bookings TO authenticated;

-- Attribution is decided by the database at insert time and is immutable afterwards.
CREATE OR REPLACE FUNCTION site_private.offer_attribution()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN NEW.offer_id := site_private.live_offer_id();
  ELSE NEW.offer_id := OLD.offer_id; END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION site_private.offer_attribution() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER bookings_offer_attribution BEFORE INSERT OR UPDATE OF offer_id ON public.bookings FOR EACH ROW EXECUTE FUNCTION site_private.offer_attribution();
CREATE TRIGGER enquiries_offer_attribution BEFORE INSERT OR UPDATE OF offer_id ON public.enquiries FOR EACH ROW EXECUTE FUNCTION site_private.offer_attribution();

-- Counts only (no contact data) for the admin offers list.
CREATE OR REPLACE FUNCTION public.offer_lead_counts()
RETURNS TABLE(offer_id uuid, bookings bigint, enquiries bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO '' AS $$
BEGIN
  IF NOT site_private.can_edit() THEN RAISE EXCEPTION 'Only offer editors can read offer counts' USING ERRCODE = '42501'; END IF;
  RETURN QUERY
    SELECT o.id,
      (SELECT count(*) FROM public.bookings b WHERE b.offer_id = o.id),
      (SELECT count(*) FROM public.enquiries e WHERE e.offer_id = o.id)
    FROM public.offers o;
END $$;
REVOKE ALL ON FUNCTION public.offer_lead_counts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.offer_lead_counts() TO authenticated;

-- Rollback-only regression checks.
DO $$
DECLARE oid uuid; cid uuid; bid uuid; eid uuid; seen int; got uuid; outsider uuid := gen_random_uuid();
BEGIN
  BEGIN
    INSERT INTO public.offers(name, slug, preset, headline, short_badge, discount_percent, ends_at, is_active, priority)
    VALUES ('Rollback test', 'rollback-offer-test', 'black_friday', 'Test', 'Test 50% off', 50, now() + interval '3 days', true, 999)
    RETURNING id INTO oid;

    SET LOCAL ROLE anon;
    SELECT count(*) INTO seen FROM public.offers WHERE id = oid;
    RESET ROLE;
    IF seen <> 1 THEN RAISE EXCEPTION 'live offer should be public'; END IF;

    INSERT INTO public.clients(contact_name, email) VALUES ('Offer Rollback', 'offer-rollback@example.invalid') RETURNING id INTO cid;
    INSERT INTO public.bookings(client_id, slot_at, duration_minutes, status, brief, offer_id)
    VALUES (cid, '2031-01-07 03:17:00+00', 30, 'requested', '{}'::jsonb, NULL) RETURNING id, offer_id INTO bid, got;
    IF got IS DISTINCT FROM oid THEN RAISE EXCEPTION 'booking should record live offer'; END IF;
    UPDATE public.bookings SET offer_id = NULL WHERE id = bid;
    IF (SELECT offer_id FROM public.bookings WHERE id = bid) IS DISTINCT FROM oid THEN RAISE EXCEPTION 'booking offer must be immutable'; END IF;
    INSERT INTO public.enquiries(client_id, message) VALUES (cid, 'rollback') RETURNING id, offer_id INTO eid, got;
    IF got IS DISTINCT FROM oid THEN RAISE EXCEPTION 'enquiry should record live offer'; END IF;

    PERFORM set_config('request.jwt.claims', json_build_object('sub', outsider, 'role', 'authenticated')::text, true);
    SET LOCAL ROLE authenticated;
    BEGIN
      INSERT INTO public.offers(name, slug, headline, short_badge, discount_percent) VALUES ('x', 'rollback-outsider', 'x', 'x', 10);
      RESET ROLE;
      RAISE EXCEPTION 'outsider insert must fail';
    EXCEPTION WHEN insufficient_privilege THEN RESET ROLE;
    END;

    UPDATE public.offers SET is_active = false WHERE id = oid;
    SET LOCAL ROLE anon;
    SELECT count(*) INTO seen FROM public.offers WHERE id = oid;
    RESET ROLE;
    IF seen <> 0 THEN RAISE EXCEPTION 'switched-off offer must be hidden'; END IF;
    INSERT INTO public.enquiries(client_id, message) VALUES (cid, 'rollback 2') RETURNING offer_id INTO got;
    IF got IS NOT NULL THEN RAISE EXCEPTION 'no offer should be recorded when none is live'; END IF;

    RAISE EXCEPTION 'offers_rollback' USING ERRCODE = 'Z0001';
  EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL;
  END;
END $$;