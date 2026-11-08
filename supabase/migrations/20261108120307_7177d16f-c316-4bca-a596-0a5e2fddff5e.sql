CREATE TABLE public.delivery_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('email','agreement_pdf','offer_letter','promotion_letter')),
  trigger_key text NOT NULL DEFAULT '',
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  journey_id uuid REFERENCES public.member_journeys(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  event_id uuid NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent','failed')),
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT delivery_outbox_once UNIQUE (event_id, kind, trigger_key)
);
CREATE INDEX delivery_outbox_due_idx ON public.delivery_outbox (status, next_attempt_at);
CREATE INDEX delivery_outbox_application_idx ON public.delivery_outbox (application_id);
CREATE INDEX delivery_outbox_journey_idx ON public.delivery_outbox (journey_id);
CREATE INDEX delivery_outbox_booking_idx ON public.delivery_outbox (booking_id);
REVOKE ALL ON public.delivery_outbox FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.delivery_outbox TO authenticated;
GRANT ALL ON public.delivery_outbox TO service_role;
ALTER TABLE public.delivery_outbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY delivery_outbox_hiring_read ON public.delivery_outbox FOR SELECT TO authenticated
USING (
  (booking_id IS NULL AND (application_id IS NOT NULL OR journey_id IS NOT NULL) AND (
     public.has_role((SELECT auth.uid()), 'admin')
     OR (public.is_hiring_staff((SELECT auth.uid())) AND EXISTS (SELECT 1 FROM public.applications a WHERE a.id = delivery_outbox.application_id))
  ))
);
CREATE POLICY delivery_outbox_crm_read ON public.delivery_outbox FOR SELECT TO authenticated
USING (
  application_id IS NULL AND journey_id IS NULL
  AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = (SELECT auth.uid()) AND r.role IN ('owner','manager','member'))
);
CREATE TRIGGER delivery_outbox_touch BEFORE UPDATE ON public.delivery_outbox FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.email_log ADD COLUMN IF NOT EXISTS outbox_id uuid REFERENCES public.delivery_outbox(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS email_log_outbox_idx ON public.email_log (outbox_id);

-- Server-only atomic claim: picks due rows (or the given ids), marks them sending, counts the attempt.
CREATE OR REPLACE FUNCTION public.claim_delivery_outbox(_ids uuid[] DEFAULT NULL, _limit integer DEFAULT 20)
RETURNS SETOF public.delivery_outbox
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.delivery_outbox o
     SET status = 'sending', attempts = o.attempts + 1, updated_at = now()
   WHERE o.id IN (
     SELECT d.id FROM public.delivery_outbox d
      WHERE d.attempts < 5
        AND (_ids IS NULL OR d.id = ANY(_ids))
        AND (
          (d.status IN ('pending','failed') AND (d.next_attempt_at <= now() OR _ids IS NOT NULL))
          OR (d.status = 'sending' AND d.updated_at < now() - interval '10 minutes')
        )
      ORDER BY d.created_at
      LIMIT greatest(1, least(_limit, 100))
      FOR UPDATE SKIP LOCKED)
  RETURNING o.*;
$$;
REVOKE ALL ON FUNCTION public.claim_delivery_outbox(uuid[], integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_delivery_outbox(uuid[], integer) TO service_role;

-- One-transaction reorder of every stage in a pipeline.
CREATE OR REPLACE FUNCTION public.reorder_pipeline_stages(_pipeline_id uuid, _stage_ids uuid[])
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE total integer; changed integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Hiring admin required.'; END IF;
  SELECT count(*) INTO total FROM public.pipeline_stages WHERE pipeline_id = _pipeline_id;
  IF total = 0 THEN RAISE EXCEPTION 'Pipeline not found.'; END IF;
  IF coalesce(array_length(_stage_ids,1),0) <> total
     OR (SELECT count(DISTINCT s) FROM unnest(_stage_ids) s) <> total
     OR EXISTS (SELECT 1 FROM unnest(_stage_ids) s WHERE NOT EXISTS (SELECT 1 FROM public.pipeline_stages p WHERE p.id = s AND p.pipeline_id = _pipeline_id))
  THEN RAISE EXCEPTION 'Send every stage of this pipeline exactly once.'; END IF;
  UPDATE public.pipeline_stages p SET sort_order = x.ord - 1
    FROM unnest(_stage_ids) WITH ORDINALITY AS x(id, ord)
   WHERE p.id = x.id AND p.pipeline_id = _pipeline_id;
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> total THEN RAISE EXCEPTION 'Stages could not be reordered.'; END IF;
  RETURN changed;
END $$;
REVOKE ALL ON FUNCTION public.reorder_pipeline_stages(uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reorder_pipeline_stages(uuid, uuid[]) TO authenticated, service_role;