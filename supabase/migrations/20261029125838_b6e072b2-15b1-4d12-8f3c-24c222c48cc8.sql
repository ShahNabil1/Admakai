CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id),
  lead_id uuid UNIQUE REFERENCES public.leads(id),
  title text NOT NULL,
  stage project_stage NOT NULL DEFAULT 'brief',
  owner_id uuid REFERENCES public.profiles(user_id),
  due_at timestamptz,
  brief jsonb NOT NULL DEFAULT '{}'::jsonb,
  revision_limit int NOT NULL DEFAULT 2,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.project_members (
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  status task_status NOT NULL DEFAULT 'todo',
  assignee_id uuid REFERENCES public.profiles(user_id),
  due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  version int NOT NULL DEFAULT 1,
  status deliverable_status NOT NULL DEFAULT 'submitted',
  storage_path text,
  external_url text,
  submitted_by uuid REFERENCES public.profiles(user_id),
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.review_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id uuid NOT NULL REFERENCES public.deliverables(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(user_id),
  timecode_ms int CHECK (timecode_ms IS NULL OR timecode_ms >= 0),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  parent_id uuid REFERENCES public.review_comments(id) ON DELETE CASCADE,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON public.projects, public.project_members, public.tasks, public.deliverables, public.review_comments FROM anon, authenticated, public;
GRANT SELECT, INSERT, UPDATE ON public.projects TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.project_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.deliverables TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.review_comments TO authenticated;
GRANT ALL ON public.projects, public.project_members, public.tasks, public.deliverables, public.review_comments TO service_role;

CREATE OR REPLACE FUNCTION app.is_project_staff(p uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT app.is_manager() OR (app.is_staff() AND EXISTS (
    SELECT 1 FROM public.projects pr WHERE pr.id = p AND (pr.owner_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.project_members m WHERE m.project_id = p AND m.user_id = auth.uid()))));
$$;
CREATE OR REPLACE FUNCTION app.is_project_client(p uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.projects pr WHERE pr.id = p AND pr.client_id = app.my_client_id());
$$;
GRANT EXECUTE ON FUNCTION app.is_project_staff(uuid), app.is_project_client(uuid) TO authenticated;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_read ON public.projects FOR SELECT TO authenticated USING (app.is_project_staff(id) OR client_id = (SELECT app.my_client_id()));
CREATE POLICY projects_create ON public.projects FOR INSERT TO authenticated WITH CHECK ((SELECT app.is_manager()));
CREATE POLICY projects_edit ON public.projects FOR UPDATE TO authenticated USING (app.is_project_staff(id)) WITH CHECK (app.is_project_staff(id));

CREATE POLICY members_read ON public.project_members FOR SELECT TO authenticated USING ((SELECT app.is_staff()));
CREATE POLICY members_add ON public.project_members FOR INSERT TO authenticated WITH CHECK ((SELECT app.is_manager()));
CREATE POLICY members_remove ON public.project_members FOR DELETE TO authenticated USING ((SELECT app.is_manager()));

CREATE POLICY tasks_read ON public.tasks FOR SELECT TO authenticated USING (app.is_project_staff(project_id));
CREATE POLICY tasks_create ON public.tasks FOR INSERT TO authenticated WITH CHECK (app.is_project_staff(project_id));
CREATE POLICY tasks_edit ON public.tasks FOR UPDATE TO authenticated USING (app.is_project_staff(project_id)) WITH CHECK (app.is_project_staff(project_id));
CREATE POLICY tasks_remove ON public.tasks FOR DELETE TO authenticated USING ((SELECT app.is_manager()));

CREATE POLICY deliverables_read ON public.deliverables FOR SELECT TO authenticated USING (app.is_project_staff(project_id) OR app.is_project_client(project_id));
CREATE POLICY deliverables_submit ON public.deliverables FOR INSERT TO authenticated WITH CHECK (app.is_project_staff(project_id) AND submitted_by = auth.uid());
CREATE POLICY deliverables_decide ON public.deliverables FOR UPDATE TO authenticated USING (app.is_project_staff(project_id) OR app.is_project_client(project_id)) WITH CHECK (app.is_project_staff(project_id) OR app.is_project_client(project_id));

CREATE POLICY comments_read ON public.review_comments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.deliverables d WHERE d.id = deliverable_id AND (app.is_project_staff(d.project_id) OR app.is_project_client(d.project_id))));
CREATE POLICY comments_add ON public.review_comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.deliverables d WHERE d.id = deliverable_id AND (app.is_project_staff(d.project_id) OR app.is_project_client(d.project_id))));
CREATE POLICY comments_resolve ON public.review_comments FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.deliverables d WHERE d.id = deliverable_id AND app.is_project_staff(d.project_id))) WITH CHECK (true);

-- Clients may only approve or request changes; only status/decided_at may change; revision limit enforced.
CREATE OR REPLACE FUNCTION public.guard_deliverable_update() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE used int; lim int;
BEGIN
  IF app.is_project_staff(OLD.project_id) THEN NEW.updated_at := now(); RETURN NEW; END IF;
  IF NEW.title IS DISTINCT FROM OLD.title OR NEW.version IS DISTINCT FROM OLD.version OR NEW.storage_path IS DISTINCT FROM OLD.storage_path
     OR NEW.external_url IS DISTINCT FROM OLD.external_url OR NEW.project_id IS DISTINCT FROM OLD.project_id OR NEW.submitted_by IS DISTINCT FROM OLD.submitted_by THEN
    RAISE EXCEPTION 'clients may only decide on deliverables' USING ERRCODE = '42501';
  END IF;
  IF OLD.status NOT IN ('submitted','resubmitted') OR NEW.status NOT IN ('approved','changes_requested') THEN
    RAISE EXCEPTION 'deliverable is not awaiting a decision' USING ERRCODE = '42501';
  END IF;
  IF NEW.status = 'changes_requested' THEN
    SELECT revision_limit INTO lim FROM projects WHERE id = OLD.project_id;
    SELECT count(*) INTO used FROM activity WHERE entity_type = 'deliverable' AND verb = 'changes_requested'
      AND entity_id IN (SELECT id FROM deliverables WHERE project_id = OLD.project_id AND title = OLD.title);
    IF used >= lim THEN RAISE EXCEPTION 'revision limit reached' USING ERRCODE = 'P0001'; END IF;
  END IF;
  NEW.decided_at := now(); NEW.updated_at := now();
  INSERT INTO activity(entity_type, entity_id, actor_id, verb, from_value, to_value)
    VALUES ('deliverable', OLD.id, auth.uid(), NEW.status::text, OLD.status::text, NEW.status::text);
  RETURN NEW;
END $$;
CREATE TRIGGER deliverables_guard BEFORE UPDATE ON public.deliverables FOR EACH ROW EXECUTE FUNCTION public.guard_deliverable_update();

CREATE OR REPLACE FUNCTION public.guard_comment_update() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.body IS DISTINCT FROM OLD.body OR NEW.author_id IS DISTINCT FROM OLD.author_id OR NEW.timecode_ms IS DISTINCT FROM OLD.timecode_ms
     OR NEW.deliverable_id IS DISTINCT FROM OLD.deliverable_id OR NEW.parent_id IS DISTINCT FROM OLD.parent_id THEN
    RAISE EXCEPTION 'only resolution may change' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER review_comments_guard BEFORE UPDATE ON public.review_comments FOR EACH ROW EXECUTE FUNCTION public.guard_comment_update();

CREATE TRIGGER projects_touch BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER tasks_touch BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Won lead automatically opens one project.
CREATE OR REPLACE FUNCTION public.lead_won_create_project() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.stage = 'won' AND OLD.stage IS DISTINCT FROM 'won' THEN
    INSERT INTO projects(client_id, lead_id, title, owner_id)
      SELECT NEW.client_id, NEW.id, coalesce(c.brand_name, c.contact_name, 'New project'), NEW.owner_id FROM clients c WHERE c.id = NEW.client_id
      ON CONFLICT (lead_id) DO NOTHING;
    UPDATE clients SET is_customer = true WHERE id = NEW.client_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER leads_won_project AFTER UPDATE OF stage ON public.leads FOR EACH ROW EXECUTE FUNCTION public.lead_won_create_project();

REVOKE EXECUTE ON FUNCTION public.guard_deliverable_update(), public.guard_comment_update(), public.lead_won_create_project() FROM public, anon, authenticated;

-- Private deliverables bucket policies (bucket created separately).
CREATE POLICY deliverables_obj_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'deliverables' AND (app.is_project_staff(((storage.foldername(name))[1])::uuid) OR app.is_project_client(((storage.foldername(name))[1])::uuid)));
CREATE POLICY deliverables_obj_write ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'deliverables' AND app.is_project_staff(((storage.foldername(name))[1])::uuid));

ALTER PUBLICATION supabase_realtime ADD TABLE public.projects, public.tasks, public.deliverables, public.review_comments;