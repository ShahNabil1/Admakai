ALTER FUNCTION public.client_call_host(uuid) SET SCHEMA app;
CREATE FUNCTION public.client_call_host(p_booking_id uuid) RETURNS text LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT app.client_call_host(p_booking_id) $$;
REVOKE ALL ON FUNCTION public.client_call_host(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.client_call_host(uuid) TO authenticated,service_role;