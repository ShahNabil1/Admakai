DROP FUNCTION public.offer_lead_counts();
CREATE OR REPLACE FUNCTION site_private.offer_lead_counts()
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
REVOKE ALL ON FUNCTION site_private.offer_lead_counts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION site_private.offer_lead_counts() TO authenticated;
CREATE OR REPLACE FUNCTION public.offer_lead_counts()
RETURNS TABLE(offer_id uuid, bookings bigint, enquiries bigint)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO '' AS $$ SELECT * FROM site_private.offer_lead_counts() $$;
REVOKE ALL ON FUNCTION public.offer_lead_counts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.offer_lead_counts() TO authenticated;