CREATE TABLE public.analytics_events (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  visitor_id text NOT NULL, session_id text NOT NULL, kind text NOT NULL,
  path text NOT NULL DEFAULT '/', label text, value integer,
  ref_host text, utm_source text, utm_medium text, utm_campaign text,
  device text, browser text, tz text, is_new boolean
);
CREATE INDEX analytics_events_time_idx ON public.analytics_events (created_at);
CREATE INDEX analytics_events_session_idx ON public.analytics_events (session_id, created_at);
REVOKE ALL ON public.analytics_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY analytics_events_editor_read ON public.analytics_events FOR SELECT TO authenticated USING (public.can_edit_site_content());

CREATE TABLE public.booking_drafts (
  id uuid PRIMARY KEY,
  visitor_id text NOT NULL, session_id text,
  name text, email text, whatsapp text, brand text, interest text,
  step integer NOT NULL DEFAULT 4,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','contacted','booked','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX booking_drafts_time_idx ON public.booking_drafts (updated_at DESC);
REVOKE ALL ON public.booking_drafts FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.booking_drafts TO authenticated;
GRANT ALL ON public.booking_drafts TO service_role;
ALTER TABLE public.booking_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY booking_drafts_editor_read ON public.booking_drafts FOR SELECT TO authenticated USING (public.can_edit_site_content());
CREATE POLICY booking_drafts_editor_update ON public.booking_drafts FOR UPDATE TO authenticated USING (public.can_edit_site_content()) WITH CHECK (public.can_edit_site_content());
CREATE POLICY booking_drafts_editor_delete ON public.booking_drafts FOR DELETE TO authenticated USING (public.can_edit_site_content());

CREATE OR REPLACE FUNCTION public.analytics_is_staff() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('owner','manager','member'))
    OR EXISTS (SELECT 1 FROM hiring_user_roles WHERE user_id = auth.uid()))
$$;
REVOKE ALL ON FUNCTION public.analytics_is_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.analytics_is_staff() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.track_events(_events jsonb) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE e jsonb; n integer := 0;
BEGIN
  IF jsonb_typeof(_events) <> 'array' OR jsonb_array_length(_events) > 60 THEN RETURN 0; END IF;
  IF public.analytics_is_staff() THEN RETURN 0; END IF;
  FOR e IN SELECT * FROM jsonb_array_elements(_events) LOOP
    CONTINUE WHEN length(coalesce(e->>'v','')) NOT BETWEEN 8 AND 64 OR length(coalesce(e->>'s','')) NOT BETWEEN 8 AND 64;
    CONTINUE WHEN coalesce(e->>'k','') NOT IN ('page_view','heartbeat','click','scroll','booking_step','enquiry');
    CONTINUE WHEN coalesce(e->>'p','/') !~ '^/[^\s]{0,199}$';
    INSERT INTO analytics_events(visitor_id, session_id, kind, path, label, value, ref_host, utm_source, utm_medium, utm_campaign, device, browser, tz, is_new)
    VALUES (e->>'v', e->>'s', e->>'k', coalesce(e->>'p','/'), left(e->>'l',80),
      CASE WHEN (e->>'n') ~ '^\d{1,6}$' THEN (e->>'n')::int END,
      left(e->>'r',120), left(e->>'us',60), left(e->>'um',60), left(e->>'uc',80),
      left(e->>'d',12), left(e->>'b',20), left(e->>'tz',40), CASE WHEN e ? 'new' THEN (e->>'new')::boolean END);
    n := n + 1;
  END LOOP;
  IF random() < 0.002 THEN DELETE FROM analytics_events WHERE created_at < now() - interval '13 months'; END IF;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.track_events(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_events(jsonb) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.save_booking_draft(_id uuid, _visitor text, _session text, _name text, _email text, _whatsapp text, _brand text, _interest text, _step integer) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF length(coalesce(_visitor,'')) NOT BETWEEN 8 AND 64 OR public.analytics_is_staff() THEN RETURN false; END IF;
  INSERT INTO booking_drafts(id, visitor_id, session_id, name, email, whatsapp, brand, interest, step)
  VALUES (_id, _visitor, left(_session,64), left(btrim(_name),100), lower(left(btrim(_email),254)), left(btrim(_whatsapp),30), left(btrim(_brand),150), left(_interest,160), least(greatest(coalesce(_step,4),1),5))
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, whatsapp = EXCLUDED.whatsapp, brand = EXCLUDED.brand, interest = EXCLUDED.interest, step = EXCLUDED.step, updated_at = now()
    WHERE booking_drafts.visitor_id = _visitor AND booking_drafts.status = 'open';
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.save_booking_draft(uuid,text,text,text,text,text,text,text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_booking_draft(uuid,text,text,text,text,text,text,text,integer) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.complete_booking_draft(_id uuid, _visitor text) RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  WITH u AS (UPDATE booking_drafts SET status = 'booked', step = 5, updated_at = now() WHERE id = _id AND visitor_id = _visitor AND status <> 'booked' RETURNING 1)
  SELECT EXISTS (SELECT 1 FROM u)
$$;
REVOKE ALL ON FUNCTION public.complete_booking_draft(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_booking_draft(uuid,text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.analytics_report(_from timestamptz, _to timestamptz) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r jsonb;
BEGIN
  IF NOT public.can_edit_site_content() THEN RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501'; END IF;
  WITH ev AS (SELECT * FROM analytics_events WHERE created_at >= _from AND created_at < _to),
  pv AS (SELECT session_id, visitor_id, path, created_at, is_new, ref_host, utm_source, utm_medium, device, browser, tz,
           row_number() OVER (PARTITION BY session_id ORDER BY created_at) rn,
           lead(path) OVER (PARTITION BY session_id ORDER BY created_at) nxt
         FROM ev WHERE kind = 'page_view'),
  ss AS (SELECT session_id, min(created_at) started, max(created_at) last_at,
           coalesce(sum(value) FILTER (WHERE kind='heartbeat'),0) secs,
           count(*) FILTER (WHERE kind='page_view') pages,
           bool_or(kind='booking_step' AND value=5) booked
         FROM ev GROUP BY session_id),
  first AS (SELECT * FROM pv WHERE rn = 1)
  SELECT jsonb_build_object(
    'totals', jsonb_build_object(
      'visitors', (SELECT count(DISTINCT visitor_id) FROM ev),
      'new_visitors', (SELECT count(DISTINCT visitor_id) FROM first WHERE is_new),
      'sessions', (SELECT count(*) FROM ss WHERE pages > 0),
      'pageviews', (SELECT count(*) FROM pv),
      'avg_session_secs', (SELECT coalesce(round(avg(secs)),0) FROM ss WHERE pages > 0),
      'bounces', (SELECT count(*) FROM ss WHERE pages = 1),
      'enquiries', (SELECT count(*) FROM enquiries WHERE created_at >= _from AND created_at < _to),
      'bookings', (SELECT count(*) FROM bookings WHERE created_at >= _from AND created_at < _to)),
    'daily', coalesce((SELECT jsonb_agg(d ORDER BY d->>'day') FROM (SELECT jsonb_build_object('day', to_char(created_at AT TIME ZONE 'Asia/Dhaka','YYYY-MM-DD'), 'pageviews', count(*), 'sessions', count(DISTINCT session_id)) d FROM pv GROUP BY 1 ORDER BY 1) x), '[]'),
    'pages', coalesce((SELECT jsonb_agg(p) FROM (SELECT jsonb_build_object('path', v.path, 'views', v.views, 'visitors', v.visitors,
        'secs', coalesce((SELECT sum(value) FROM ev WHERE kind='heartbeat' AND ev.path = v.path),0),
        'scroll', (SELECT round(avg(m)) FROM (SELECT max(value) m FROM ev WHERE kind='scroll' AND ev.path = v.path GROUP BY session_id) q),
        'exits', (SELECT count(*) FROM pv p2 WHERE p2.path = v.path AND p2.nxt IS NULL)) p
      FROM (SELECT path, count(*) views, count(DISTINCT visitor_id) visitors FROM pv GROUP BY path ORDER BY count(*) DESC LIMIT 60) v) y), '[]'),
    'flows', coalesce((SELECT jsonb_agg(f) FROM (SELECT jsonb_build_object('from', a, 'to', b, 'n', n) f FROM (
        SELECT '(entry)' a, path b, count(*) n FROM pv WHERE rn = 1 GROUP BY path
        UNION ALL SELECT path, nxt, count(*) FROM pv WHERE nxt IS NOT NULL AND nxt <> path GROUP BY path, nxt
        UNION ALL SELECT path, '(left)', count(*) FROM pv WHERE nxt IS NULL GROUP BY path) t ORDER BY n DESC LIMIT 80) z), '[]'),
    'funnel', jsonb_build_object(
      'book_click', (SELECT count(DISTINCT session_id) FROM ev WHERE kind='click' AND label ILIKE '%book%'),
      'book_open', (SELECT count(DISTINCT session_id) FROM pv WHERE path = '/book'),
      'step1', (SELECT count(DISTINCT session_id) FROM ev WHERE kind='booking_step' AND value >= 2),
      'step2', (SELECT count(DISTINCT session_id) FROM ev WHERE kind='booking_step' AND value >= 3),
      'step3', (SELECT count(DISTINCT session_id) FROM ev WHERE kind='booking_step' AND value >= 4),
      'details', (SELECT count(*) FROM booking_drafts WHERE created_at >= _from AND created_at < _to),
      'booked', (SELECT count(DISTINCT session_id) FROM ev WHERE kind='booking_step' AND value = 5)),
    'clicks', coalesce((SELECT jsonb_agg(c) FROM (SELECT jsonb_build_object('label', label, 'path', path, 'n', count(*)) c FROM ev WHERE kind='click' AND label IS NOT NULL GROUP BY label, path ORDER BY count(*) DESC LIMIT 40) c), '[]'),
    'sources', coalesce((SELECT jsonb_agg(s) FROM (SELECT jsonb_build_object('source', src, 'n', count(*)) s FROM (
        SELECT CASE WHEN utm_source IS NOT NULL THEN 'Campaign: ' || utm_source
          WHEN ref_host IS NULL OR ref_host = '' THEN 'Direct'
          WHEN ref_host ~ 'google\.' THEN 'Google' WHEN ref_host ~ '(facebook|fb)\.' THEN 'Facebook'
          WHEN ref_host ~ 'instagram\.' THEN 'Instagram' WHEN ref_host ~ 'linkedin\.' THEN 'LinkedIn'
          WHEN ref_host ~ 'youtube\.' THEN 'YouTube' WHEN ref_host ~ '(bing|duckduckgo|yahoo)\.' THEN 'Other search'
          ELSE ref_host END src FROM first) t GROUP BY src ORDER BY count(*) DESC LIMIT 20) s), '[]'),
    'devices', coalesce((SELECT jsonb_object_agg(coalesce(device,'unknown'), n) FROM (SELECT device, count(*) n FROM first GROUP BY device) d), '{}'),
    'browsers', coalesce((SELECT jsonb_object_agg(coalesce(browser,'Other'), n) FROM (SELECT browser, count(*) n FROM first GROUP BY browser) d), '{}'),
    'zones', coalesce((SELECT jsonb_agg(z) FROM (SELECT jsonb_build_object('tz', coalesce(tz,'Unknown'), 'n', count(*)) z FROM first GROUP BY tz ORDER BY count(*) DESC LIMIT 12) z), '[]'),
    'videos', coalesce((SELECT jsonb_agg(v) FROM (SELECT jsonb_build_object('title', w.title, 'n', count(*)) v FROM work_views wv JOIN works w ON w.id = wv.work_id WHERE wv.created_at >= _from AND wv.created_at < _to GROUP BY w.title ORDER BY count(*) DESC LIMIT 10) v), '[]'),
    'live', (SELECT jsonb_build_object('n', count(DISTINCT session_id), 'pages', coalesce(jsonb_agg(DISTINCT path), '[]')) FROM analytics_events WHERE created_at > now() - interval '5 minutes'),
    'sessions', coalesce((SELECT jsonb_agg(s ORDER BY s->>'started' DESC) FROM (SELECT jsonb_build_object('id', ss.session_id, 'started', ss.started, 'secs', ss.secs, 'pages', ss.pages, 'booked', coalesce(ss.booked,false),
        'entry', f.path, 'source', coalesce(f.utm_source, nullif(f.ref_host,''), 'Direct'), 'device', f.device) s
      FROM ss JOIN first f USING (session_id) ORDER BY ss.started DESC LIMIT 60) s), '[]')
  ) INTO r;
  RETURN r;
END $$;
REVOKE ALL ON FUNCTION public.analytics_report(timestamptz, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.analytics_report(timestamptz, timestamptz) TO authenticated, service_role;