GRANT USAGE ON SCHEMA app TO supabase_read_only_user;
GRANT EXECUTE ON FUNCTION app.open_slots(date,date), public.open_slots(date,date) TO supabase_read_only_user;