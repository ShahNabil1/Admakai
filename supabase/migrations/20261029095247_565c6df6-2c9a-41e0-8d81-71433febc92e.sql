GRANT USAGE ON SCHEMA app TO postgres;
GRANT EXECUTE ON FUNCTION app.open_slots(date,date), public.open_slots(date,date) TO postgres;