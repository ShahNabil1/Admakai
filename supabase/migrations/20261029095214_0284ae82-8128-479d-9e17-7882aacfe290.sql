CREATE TABLE public.availability (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), weekday integer NOT NULL CHECK (weekday BETWEEN 0 AND 6),
 start_time time NOT NULL, end_time time NOT NULL, is_active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), CHECK (end_time > start_time)
);
REVOKE ALL ON public.availability FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.availability TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.availability TO authenticated;
GRANT ALL ON public.availability TO service_role;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY availability_read ON public.availability FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY availability_create ON public.availability FOR INSERT TO authenticated WITH CHECK ((SELECT app.is_manager()));
CREATE POLICY availability_edit ON public.availability FOR UPDATE TO authenticated USING ((SELECT app.is_manager())) WITH CHECK ((SELECT app.is_manager()));
CREATE POLICY availability_remove ON public.availability FOR DELETE TO authenticated USING ((SELECT app.is_manager()));

CREATE TABLE public.availability_rules (
 id boolean PRIMARY KEY DEFAULT true CHECK (id),
 slot_minutes integer NOT NULL DEFAULT 30 CHECK (slot_minutes > 0),
 gap_minutes integer NOT NULL DEFAULT 15 CHECK (gap_minutes >= 0),
 min_notice_hours integer NOT NULL DEFAULT 4 CHECK (min_notice_hours >= 0),
 max_horizon_days integer NOT NULL DEFAULT 21 CHECK (max_horizon_days >= 0),
 max_per_day integer NOT NULL DEFAULT 5 CHECK (max_per_day > 0),
 default_meet_link text, business_timezone text NOT NULL DEFAULT 'Asia/Dhaka'
);
REVOKE ALL ON public.availability_rules FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.availability_rules TO anon, authenticated;
GRANT UPDATE ON public.availability_rules TO authenticated;
GRANT ALL ON public.availability_rules TO service_role;
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY availability_rules_read ON public.availability_rules FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY availability_rules_edit ON public.availability_rules FOR UPDATE TO authenticated USING ((SELECT app.is_manager())) WITH CHECK ((SELECT app.is_manager()));
INSERT INTO public.availability_rules(id,slot_minutes,gap_minutes,min_notice_hours,max_horizon_days,max_per_day,business_timezone) VALUES(true,30,15,4,21,5,'Asia/Dhaka');

CREATE TABLE public.blocked_dates (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), date_from date NOT NULL, date_to date NOT NULL,
 reason text, created_at timestamptz NOT NULL DEFAULT now(), CHECK (date_to >= date_from)
);
REVOKE ALL ON public.blocked_dates FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.blocked_dates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blocked_dates TO authenticated;
GRANT ALL ON public.blocked_dates TO service_role;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY blocked_dates_read ON public.blocked_dates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY blocked_dates_create ON public.blocked_dates FOR INSERT TO authenticated WITH CHECK ((SELECT app.is_manager()));
CREATE POLICY blocked_dates_edit ON public.blocked_dates FOR UPDATE TO authenticated USING ((SELECT app.is_manager())) WITH CHECK ((SELECT app.is_manager()));
CREATE POLICY blocked_dates_remove ON public.blocked_dates FOR DELETE TO authenticated USING ((SELECT app.is_manager()));
INSERT INTO public.availability(weekday,start_time,end_time,is_active) VALUES
 (0,'11:00','13:00',true),(0,'16:00','21:00',true),
 (1,'11:00','13:00',true),(1,'16:00','21:00',true),
 (2,'11:00','13:00',true),(2,'16:00','21:00',true),
 (3,'11:00','13:00',true),(3,'16:00','21:00',true),
 (4,'11:00','13:00',true),(4,'16:00','21:00',true),
 (6,'16:00','20:00',true);

CREATE FUNCTION app.open_slots(p_from date DEFAULT NULL,p_to date DEFAULT NULL)
RETURNS TABLE(slot_at timestamptz,local_day date,local_time time)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.availability_rules%ROWTYPE; today_local date; first_day date; last_day date;
BEGIN
 SELECT * INTO r FROM public.availability_rules WHERE id=true;
 IF NOT FOUND THEN RETURN; END IF;
 today_local := (now() AT TIME ZONE r.business_timezone)::date;
 first_day := COALESCE(p_from,today_local);
 last_day := LEAST(COALESCE(p_to,first_day+r.max_horizon_days),today_local+r.max_horizon_days);
 first_day := GREATEST(first_day,today_local);
 IF first_day>last_day THEN RETURN; END IF;
 RETURN QUERY
 WITH days AS (
  SELECT first_day+g.n AS day FROM generate_series(0,last_day-first_day) AS g(n)
 ), candidates AS (
  SELECT d.day, times.local_start, times.local_start AT TIME ZONE r.business_timezone AS starts_at
  FROM days d JOIN public.availability a ON a.is_active AND a.weekday=extract(dow FROM d.day)::integer
  CROSS JOIN LATERAL generate_series(d.day+a.start_time,d.day+a.end_time-make_interval(mins=>r.slot_minutes),make_interval(mins=>r.slot_minutes+r.gap_minutes)) AS times(local_start)
  WHERE NOT EXISTS(SELECT 1 FROM public.blocked_dates bd WHERE d.day BETWEEN bd.date_from AND bd.date_to)
  AND (SELECT count(*) FROM public.bookings b WHERE b.slot_at >= (d.day::timestamp AT TIME ZONE r.business_timezone)
   AND b.slot_at < ((d.day+1)::timestamp AT TIME ZONE r.business_timezone) AND b.status IN ('requested','in_review','confirmed')) < r.max_per_day
 )
 SELECT DISTINCT c.starts_at,c.day,c.local_start::time FROM candidates c
 WHERE c.starts_at >= now()+make_interval(hours=>r.min_notice_hours)
 AND NOT EXISTS(SELECT 1 FROM public.bookings b WHERE b.slot_at=c.starts_at AND b.status NOT IN ('cancelled','rescheduled'))
 ORDER BY c.starts_at;
END;
$$;
REVOKE ALL ON FUNCTION app.open_slots(date,date) FROM PUBLIC;
GRANT USAGE ON SCHEMA app TO anon;
GRANT EXECUTE ON FUNCTION app.open_slots(date,date) TO anon, authenticated, service_role;
-- Public API forwarding only: all slot computation remains in app.open_slots.
CREATE FUNCTION public.open_slots(p_from date DEFAULT NULL,p_to date DEFAULT NULL)
RETURNS TABLE(slot_at timestamptz,local_day date,local_time time)
LANGUAGE sql STABLE SET search_path='' AS $$ SELECT * FROM app.open_slots(p_from,p_to) $$;
REVOKE ALL ON FUNCTION public.open_slots(date,date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.open_slots(date,date) TO anon,authenticated,service_role;

DO $$
DECLARE r public.availability_rules%ROWTYPE; d date; friday date; sat date; today_local date; c uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); s timestamptz; n integer; compare_slots timestamptz[]; after_slots timestamptz[];
BEGIN
 BEGIN
  SELECT * INTO r FROM public.availability_rules;
  IF r.slot_minutes<>30 OR r.gap_minutes<>15 OR r.min_notice_hours<>4 OR r.max_horizon_days<>21 OR r.max_per_day<>5 OR r.business_timezone<>'Asia/Dhaka' THEN RAISE EXCEPTION 'Requested rule defaults failed'; END IF;
  SELECT count(*) INTO n FROM public.availability;
  IF n<>11 OR EXISTS(SELECT 1 FROM public.availability WHERE weekday=5 OR NOT is_active) THEN RAISE EXCEPTION 'Seeded availability failed'; END IF;
  today_local := (now() AT TIME ZONE 'Asia/Dhaka')::date;
  d := today_local+1;
  WHILE extract(dow FROM d)<>0 LOOP d:=d+1; END LOOP;
  friday:=d+5; sat:=d+6;
  SELECT count(*) INTO n FROM app.open_slots(d,d);
  IF n<>10 THEN RAISE EXCEPTION 'Sunday split windows should produce 10 slots, got %',n; END IF;
  IF NOT EXISTS(SELECT 1 FROM app.open_slots(d,d) WHERE local_time='11:45'::time) OR EXISTS(SELECT 1 FROM app.open_slots(d,d) WHERE local_time>'20:30'::time OR local_time BETWEEN '13:00'::time AND '15:59'::time) THEN RAISE EXCEPTION '30 minute duration and 15 minute gap failed'; END IF;
  SELECT count(*) INTO n FROM app.open_slots(friday,friday);
  IF n<>0 THEN RAISE EXCEPTION 'Friday must be closed'; END IF;
  SELECT count(*) INTO n FROM app.open_slots(sat,sat);
  IF n<>5 THEN RAISE EXCEPTION 'Saturday should produce 5 slots'; END IF;
  IF EXISTS(SELECT 1 FROM app.open_slots(today_local,today_local+100) WHERE local_day>today_local+21 OR slot_at<now()+interval '4 hours' OR slot_at AT TIME ZONE 'Asia/Dhaka' <> local_day+local_time) THEN RAISE EXCEPTION 'Horizon/notice/timezone failed'; END IF;
  SELECT array_agg(slot_at ORDER BY slot_at) INTO compare_slots FROM app.open_slots(d,d);
  PERFORM set_config('TimeZone','America/New_York',true);
  SELECT array_agg(slot_at ORDER BY slot_at) INTO after_slots FROM app.open_slots(d,d);
  IF compare_slots IS DISTINCT FROM after_slots THEN RAISE EXCEPTION 'Session timezone shifted Dhaka slots'; END IF;
  INSERT INTO public.blocked_dates(date_from,date_to) VALUES(d,d+1);
  SELECT count(*) INTO n FROM app.open_slots(d,d+1);
  IF n<>0 THEN RAISE EXCEPTION 'Blocked range not excluded'; END IF;
  DELETE FROM public.blocked_dates WHERE date_from=d AND date_to=d+1;
  INSERT INTO public.clients(id,brand_name) VALUES(c,'Slot engine rollback test');
  SELECT slot_at INTO s FROM app.open_slots(d,d) LIMIT 1;
  INSERT INTO public.bookings(id,client_id,slot_at) VALUES(b,c,s);
  IF EXISTS(SELECT 1 FROM app.open_slots(d,d) WHERE slot_at=s) THEN RAISE EXCEPTION 'Taken slot remained open'; END IF;
  UPDATE public.bookings SET status='cancelled' WHERE id=b;
  IF NOT EXISTS(SELECT 1 FROM app.open_slots(d,d) WHERE slot_at=s) THEN RAISE EXCEPTION 'Cancelled slot not released'; END IF;
  UPDATE public.bookings SET status='rescheduled' WHERE id=b;
  IF NOT EXISTS(SELECT 1 FROM app.open_slots(d,d) WHERE slot_at=s) THEN RAISE EXCEPTION 'Rescheduled slot not released'; END IF;
  UPDATE public.bookings SET status='completed' WHERE id=b;
  IF EXISTS(SELECT 1 FROM app.open_slots(d,d) WHERE slot_at=s) THEN RAISE EXCEPTION 'Completed slot must stay taken'; END IF;
  DELETE FROM public.bookings WHERE id=b;
  INSERT INTO public.bookings(client_id,slot_at,status) SELECT c,slot_at,CASE row_number() OVER(ORDER BY slot_at)%3 WHEN 0 THEN 'confirmed'::public.booking_status WHEN 1 THEN 'requested'::public.booking_status ELSE 'in_review'::public.booking_status END FROM app.open_slots(d,d) LIMIT 5;
  IF EXISTS(SELECT 1 FROM app.open_slots(d,d)) THEN RAISE EXCEPTION 'Five active bookings must close local day'; END IF;
  SET LOCAL ROLE anon;
  SELECT count(*) INTO n FROM public.availability;
  IF n<>11 THEN RAISE EXCEPTION 'Anonymous availability read failed'; END IF;
  PERFORM slot_at FROM public.open_slots() LIMIT 1;
  BEGIN UPDATE public.availability_rules SET slot_minutes=60; RAISE EXCEPTION 'Anonymous changed rules'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RESET ROLE;
  RAISE EXCEPTION USING ERRCODE='Z0001',MESSAGE='Rollback successful slot tests';
 EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL; END;
END;
$$;