CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq;
CREATE TABLE public.invoices (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 number text UNIQUE,
 client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
 project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
 status public.invoice_status NOT NULL DEFAULT 'draft',
 currency text NOT NULL DEFAULT 'BDT' CHECK (currency ~ '^[A-Z]{3}$'),
 issued_at date, due_at date,
 notes text CHECK (char_length(notes) <= 2000),
 subtotal numeric(12,2) NOT NULL DEFAULT 0, paid_total numeric(12,2) NOT NULL DEFAULT 0,
 created_by uuid DEFAULT auth.uid(),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.invoice_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
 description text NOT NULL CHECK (char_length(description) BETWEEN 1 AND 300),
 quantity numeric(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
 unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.payments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
 amount numeric(12,2) NOT NULL CHECK (amount > 0),
 method text NOT NULL DEFAULT 'bank' CHECK (method IN ('bank','bkash','nagad','card','cash','other')),
 reference text CHECK (char_length(reference) <= 120),
 paid_at date NOT NULL DEFAULT current_date,
 recorded_by uuid DEFAULT auth.uid(),
 created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.invoices, public.invoice_items, public.payments FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices, public.invoice_items TO authenticated;
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT ALL ON public.invoices, public.invoice_items, public.payments TO service_role;
GRANT USAGE ON SEQUENCE public.invoice_number_seq TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY invoices_read ON public.invoices FOR SELECT TO authenticated USING ((SELECT app.is_staff()) OR (status <> 'draft' AND client_id = (SELECT app.my_client_id())));
CREATE POLICY invoices_insert ON public.invoices FOR INSERT TO authenticated WITH CHECK ((SELECT app.is_manager()));
CREATE POLICY invoices_update ON public.invoices FOR UPDATE TO authenticated USING ((SELECT app.is_manager())) WITH CHECK ((SELECT app.is_manager()));
CREATE POLICY invoices_delete ON public.invoices FOR DELETE TO authenticated USING ((SELECT app.is_manager()) AND status = 'draft');
CREATE POLICY items_read ON public.invoice_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id));
CREATE POLICY items_write ON public.invoice_items FOR ALL TO authenticated
 USING ((SELECT app.is_manager()) AND EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND i.status = 'draft'))
 WITH CHECK ((SELECT app.is_manager()) AND EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND i.status = 'draft'));
CREATE POLICY payments_read ON public.payments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id));
CREATE POLICY payments_insert ON public.payments FOR INSERT TO authenticated WITH CHECK ((SELECT app.is_manager()) AND recorded_by = (SELECT auth.uid())
 AND EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND i.status IN ('sent','partially_paid','overdue')));

CREATE TRIGGER invoices_touch BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.invoice_before_write() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF TG_OP = 'UPDATE' THEN
  NEW.number := OLD.number; NEW.subtotal := OLD.subtotal; NEW.paid_total := OLD.paid_total; NEW.created_by := OLD.created_by;
  IF OLD.status IN ('paid','void') AND NEW.status <> OLD.status AND current_user <> 'postgres' THEN
   RAISE EXCEPTION 'Paid or void invoices cannot change status' USING ERRCODE = '42501';
  END IF;
  IF OLD.status <> 'draft' AND (NEW.client_id <> OLD.client_id OR NEW.currency <> OLD.currency) THEN
   RAISE EXCEPTION 'Sent invoices cannot change client or currency' USING ERRCODE = '42501';
  END IF;
 ELSE
  NEW.subtotal := 0; NEW.paid_total := 0;
 END IF;
 IF NEW.status <> 'draft' AND NEW.number IS NULL THEN
  NEW.number := 'AD-' || to_char(now() AT TIME ZONE 'Asia/Dhaka', 'YYYY') || '-' || lpad(nextval('public.invoice_number_seq')::text, 4, '0');
  NEW.issued_at := coalesce(NEW.issued_at, (now() AT TIME ZONE 'Asia/Dhaka')::date);
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER invoices_guard BEFORE INSERT OR UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.invoice_before_write();

CREATE OR REPLACE FUNCTION public.invoice_recalc() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inv uuid := coalesce(NEW.invoice_id, OLD.invoice_id); s numeric; p numeric; st public.invoice_status;
BEGIN
 SELECT coalesce(sum(quantity*unit_price),0) INTO s FROM public.invoice_items WHERE invoice_id = inv;
 SELECT coalesce(sum(amount),0) INTO p FROM public.payments WHERE invoice_id = inv;
 SELECT status INTO st FROM public.invoices WHERE id = inv;
 IF st IN ('sent','partially_paid','overdue') AND p > 0 THEN st := CASE WHEN p >= s THEN 'paid' ELSE 'partially_paid' END; END IF;
 UPDATE public.invoices SET subtotal = s, paid_total = p, status = st WHERE id = inv;
 RETURN NULL;
END $$;
-- bypass guard field reset for recalc: guard keeps OLD totals on UPDATE, so recalc writes via session flag
CREATE OR REPLACE FUNCTION public.invoice_before_write() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF TG_OP = 'UPDATE' THEN
  NEW.number := OLD.number; NEW.created_by := OLD.created_by;
  IF coalesce(current_setting('app.invoice_recalc', true),'') <> 'on' THEN
   NEW.subtotal := OLD.subtotal; NEW.paid_total := OLD.paid_total;
   IF OLD.status IN ('paid','void') AND NEW.status <> OLD.status THEN
    RAISE EXCEPTION 'Paid or void invoices cannot change status' USING ERRCODE = '42501';
   END IF;
   IF NEW.status IN ('paid','partially_paid') AND NEW.status <> OLD.status THEN
    RAISE EXCEPTION 'Record a payment to mark an invoice paid' USING ERRCODE = '42501';
   END IF;
  END IF;
  IF OLD.status <> 'draft' AND (NEW.client_id <> OLD.client_id OR NEW.currency <> OLD.currency) THEN
   RAISE EXCEPTION 'Sent invoices cannot change client or currency' USING ERRCODE = '42501';
  END IF;
  IF OLD.status = 'draft' AND NEW.status <> 'draft' AND NEW.status <> 'void' AND OLD.subtotal <= 0 THEN
   RAISE EXCEPTION 'Add at least one line item before sending' USING ERRCODE = '23514';
  END IF;
 ELSE
  NEW.subtotal := 0; NEW.paid_total := 0;
  IF NEW.status <> 'draft' THEN RAISE EXCEPTION 'New invoices start as drafts' USING ERRCODE = '23514'; END IF;
 END IF;
 IF NEW.status <> 'draft' AND NEW.number IS NULL THEN
  NEW.number := 'AD-' || to_char(now() AT TIME ZONE 'Asia/Dhaka', 'YYYY') || '-' || lpad(nextval('public.invoice_number_seq')::text, 4, '0');
  NEW.issued_at := coalesce(NEW.issued_at, (now() AT TIME ZONE 'Asia/Dhaka')::date);
 END IF;
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.invoice_recalc() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inv uuid := coalesce(NEW.invoice_id, OLD.invoice_id); s numeric; p numeric; st public.invoice_status;
BEGIN
 SELECT coalesce(sum(quantity*unit_price),0) INTO s FROM public.invoice_items WHERE invoice_id = inv;
 SELECT coalesce(sum(amount),0) INTO p FROM public.payments WHERE invoice_id = inv;
 SELECT status INTO st FROM public.invoices WHERE id = inv;
 IF st IS NULL THEN RETURN NULL; END IF;
 IF st IN ('sent','partially_paid','overdue') AND p > 0 THEN st := CASE WHEN p >= s THEN 'paid'::public.invoice_status ELSE 'partially_paid'::public.invoice_status END; END IF;
 PERFORM set_config('app.invoice_recalc','on',true);
 UPDATE public.invoices SET subtotal = s, paid_total = p, status = st WHERE id = inv;
 PERFORM set_config('app.invoice_recalc','off',true);
 RETURN NULL;
END $$;
CREATE TRIGGER items_recalc AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION public.invoice_recalc();
CREATE TRIGGER payments_recalc AFTER INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION public.invoice_recalc();

CREATE OR REPLACE FUNCTION app.mark_overdue_invoices() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
 UPDATE public.invoices SET status = 'overdue'
 WHERE status IN ('sent','partially_paid') AND due_at < (now() AT TIME ZONE 'Asia/Dhaka')::date;
 GET DIAGNOSTICS n = ROW_COUNT; RETURN n;
END $$;
REVOKE ALL ON FUNCTION app.mark_overdue_invoices() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION app.mark_overdue_invoices() TO service_role;
REVOKE ALL ON FUNCTION public.invoice_before_write(), public.invoice_recalc() FROM PUBLIC, anon, authenticated;

-- Generic activity logging
CREATE OR REPLACE FUNCTION public.log_activity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE col text := TG_ARGV[0]; o text; n text; actor uuid := auth.uid();
BEGIN
 IF actor IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = actor) THEN actor := NULL; END IF;
 IF TG_OP = 'INSERT' THEN
  INSERT INTO public.activity(entity_type, entity_id, actor_id, verb, to_value, meta)
  VALUES (TG_TABLE_NAME, NEW.id, actor, 'created', CASE WHEN col IS NULL THEN NULL ELSE to_jsonb(NEW)->>col END, jsonb_build_object('title', coalesce(to_jsonb(NEW)->>'title', to_jsonb(NEW)->>'number', to_jsonb(NEW)->>'amount')));
 ELSIF col IS NOT NULL THEN
  o := to_jsonb(OLD)->>col; n := to_jsonb(NEW)->>col;
  IF o IS DISTINCT FROM n THEN
   INSERT INTO public.activity(entity_type, entity_id, actor_id, verb, from_value, to_value, meta)
   VALUES (TG_TABLE_NAME, NEW.id, actor, col || '_changed', o, n, jsonb_build_object('title', coalesce(to_jsonb(NEW)->>'title', to_jsonb(NEW)->>'number')));
  END IF;
 END IF;
 RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.log_activity() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER bookings_activity AFTER UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.log_activity('status');
CREATE TRIGGER projects_activity AFTER INSERT OR UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.log_activity('stage');
CREATE TRIGGER tasks_activity AFTER INSERT OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.log_activity('status');
CREATE TRIGGER deliverables_activity AFTER INSERT OR UPDATE ON public.deliverables FOR EACH ROW EXECUTE FUNCTION public.log_activity('status');
CREATE TRIGGER invoices_activity AFTER INSERT OR UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.log_activity('status');
CREATE TRIGGER payments_activity AFTER INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION public.log_activity(NULL);

ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices, public.payments, public.activity;
GRANT SELECT ON public.invoices, public.invoice_items, public.payments TO supabase_read_only_user;