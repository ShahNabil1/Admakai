DO $$
DECLARE c uuid; i uuid; r record; failed boolean;
BEGIN
 BEGIN
  INSERT INTO public.clients(contact_name, email) VALUES ('Billing Test', 'billing-proof-'||gen_random_uuid()||'@example.invalid') RETURNING id INTO c;
  INSERT INTO public.invoices(client_id) VALUES (c) RETURNING id INTO i;
  failed := false;
  BEGIN UPDATE public.invoices SET status='sent' WHERE id=i; EXCEPTION WHEN check_violation THEN failed := true; END;
  IF NOT failed THEN RAISE EXCEPTION 'empty invoice was sent'; END IF;
  INSERT INTO public.invoice_items(invoice_id, description, quantity, unit_price) VALUES (i,'Reel',2,1500);
  UPDATE public.invoices SET status='sent' WHERE id=i;
  SELECT * INTO r FROM public.invoices WHERE id=i;
  IF r.number !~ '^AD-\d{4}-\d{4}$' OR r.subtotal <> 3000 THEN RAISE EXCEPTION 'numbering/total wrong: % %', r.number, r.subtotal; END IF;
  failed := false;
  BEGIN UPDATE public.invoices SET status='paid' WHERE id=i; EXCEPTION WHEN insufficient_privilege THEN failed := true; END;
  IF NOT failed THEN RAISE EXCEPTION 'manual paid allowed'; END IF;
  INSERT INTO public.payments(invoice_id, amount) VALUES (i, 1000);
  SELECT * INTO r FROM public.invoices WHERE id=i;
  IF r.status <> 'partially_paid' OR r.paid_total <> 1000 THEN RAISE EXCEPTION 'partial wrong %', r.status; END IF;
  INSERT INTO public.payments(invoice_id, amount) VALUES (i, 2000);
  SELECT * INTO r FROM public.invoices WHERE id=i;
  IF r.status <> 'paid' THEN RAISE EXCEPTION 'paid wrong %', r.status; END IF;
  IF (SELECT count(*) FROM public.activity WHERE entity_id=i AND verb='status_changed') < 3 THEN RAISE EXCEPTION 'activity missing'; END IF;
  RAISE EXCEPTION 'proof_ok';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM <> 'proof_ok' THEN RAISE; END IF;
 END;
END $$;