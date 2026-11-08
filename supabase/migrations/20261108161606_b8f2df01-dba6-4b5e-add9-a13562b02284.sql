ALTER TABLE public.works ADD COLUMN IF NOT EXISTS base_views integer NOT NULL DEFAULT 0 CHECK (base_views BETWEEN 0 AND 100000000),
  ADD COLUMN IF NOT EXISTS base_reactions integer NOT NULL DEFAULT 0 CHECK (base_reactions BETWEEN 0 AND 100000000);

CREATE TABLE public.work_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id uuid NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
  viewer_id uuid,
  visitor_id text NOT NULL CHECK (length(visitor_id) BETWEEN 8 AND 64),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX work_views_work_time ON public.work_views(work_id, created_at DESC);
CREATE INDEX work_views_dedupe ON public.work_views(work_id, visitor_id, created_at DESC);
REVOKE ALL ON public.work_views FROM anon, authenticated;
GRANT SELECT ON public.work_views TO authenticated;
GRANT ALL ON public.work_views TO service_role;
ALTER TABLE public.work_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY work_views_staff_read ON public.work_views FOR SELECT TO authenticated USING (public.can_edit_site_content());

CREATE TABLE public.work_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id uuid NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL CHECK (kind IN ('like','celebrate','support','love','insightful','funny')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (work_id, user_id)
);
REVOKE ALL ON public.work_reactions FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_reactions TO authenticated;
GRANT ALL ON public.work_reactions TO service_role;
ALTER TABLE public.work_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY work_reactions_read ON public.work_reactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.can_edit_site_content());
CREATE POLICY work_reactions_insert ON public.work_reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY work_reactions_update ON public.work_reactions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY work_reactions_delete ON public.work_reactions FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.work_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id uuid NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
  user_id uuid DEFAULT auth.uid(),
  author_label text NOT NULL CHECK (length(btrim(author_label)) BETWEEN 1 AND 80),
  body text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 1000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','hidden')),
  team_kind text CHECK (team_kind IN ('team','client')),
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX work_comments_work ON public.work_comments(work_id, status, created_at DESC);
REVOKE ALL ON public.work_comments FROM anon, authenticated;
GRANT SELECT ON public.work_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_comments TO authenticated;
GRANT ALL ON public.work_comments TO service_role;
ALTER TABLE public.work_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY work_comments_public_read ON public.work_comments FOR SELECT TO anon USING (status = 'approved');
CREATE POLICY work_comments_read ON public.work_comments FOR SELECT TO authenticated USING (status = 'approved' OR user_id = auth.uid() OR public.can_edit_site_content());
CREATE POLICY work_comments_insert ON public.work_comments FOR INSERT TO authenticated WITH CHECK (
  (user_id = auth.uid() AND status = 'pending' AND team_kind IS NULL AND pinned = false)
  OR public.can_edit_site_content());
CREATE POLICY work_comments_update ON public.work_comments FOR UPDATE TO authenticated USING (public.can_edit_site_content()) WITH CHECK (public.can_edit_site_content());
CREATE POLICY work_comments_delete ON public.work_comments FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.can_edit_site_content());

CREATE OR REPLACE FUNCTION public.work_feedback_touch() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER work_reactions_touch BEFORE UPDATE ON public.work_reactions FOR EACH ROW EXECUTE FUNCTION public.work_feedback_touch();
CREATE TRIGGER work_comments_touch BEFORE UPDATE ON public.work_comments FOR EACH ROW EXECUTE FUNCTION public.work_feedback_touch();

CREATE OR REPLACE FUNCTION public.record_work_view(_work_id uuid, _visitor_id text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _visitor_id IS NULL OR length(_visitor_id) NOT BETWEEN 8 AND 64 THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM works WHERE id = _work_id AND published) THEN RETURN false; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(_work_id::text || _visitor_id));
  IF EXISTS (SELECT 1 FROM work_views WHERE work_id = _work_id AND visitor_id = _visitor_id AND created_at > now() - interval '24 hours') THEN RETURN false; END IF;
  INSERT INTO work_views(work_id, viewer_id, visitor_id) VALUES (_work_id, auth.uid(), _visitor_id);
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.record_work_view(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_work_view(uuid, text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.work_public_stats(_work_ids uuid[])
RETURNS TABLE(work_id uuid, views bigint, reactions bigint, comments bigint, top_kinds text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT w.id,
    w.base_views + (SELECT count(*) FROM work_views v WHERE v.work_id = w.id),
    w.base_reactions + (SELECT count(*) FROM work_reactions r WHERE r.work_id = w.id),
    (SELECT count(*) FROM work_comments c WHERE c.work_id = w.id AND c.status = 'approved'),
    COALESCE((SELECT array_agg(k ORDER BY n DESC) FROM (SELECT kind k, count(*) n FROM work_reactions r WHERE r.work_id = w.id GROUP BY kind ORDER BY n DESC LIMIT 3) t), '{}')
  FROM works w WHERE w.id = ANY(_work_ids) AND w.published
$$;
REVOKE ALL ON FUNCTION public.work_public_stats(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.work_public_stats(uuid[]) TO anon, authenticated, service_role;