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
    'daily', coalesce((SELECT jsonb_agg(d ORDER BY d->>'day') FROM (SELECT jsonb_build_object('day', to_char(created_at AT TIME ZONE 'Asia/Dhaka','YYYY-MM-DD'), 'pageviews', count(*), 'sessions', count(DISTINCT session_id)) d FROM pv GROUP BY to_char(created_at AT TIME ZONE 'Asia/Dhaka','YYYY-MM-DD')) x), '[]'),
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