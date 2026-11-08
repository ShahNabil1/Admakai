create or replace function public.fill_profile_from_oauth()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  n text := nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')), '');
  a text := nullif(coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''), '');
begin
  if a is not null and a !~ '^https://' then a := null; end if;
  if n is null and a is null then return new; end if;
  begin
    update public.profiles
       set full_name = coalesce(nullif(trim(full_name), ''), n),
           avatar_url = coalesce(nullif(avatar_url, ''), a)
     where user_id = new.id
       and ((nullif(trim(full_name), '') is null and n is not null) or (nullif(avatar_url, '') is null and a is not null));
    if n ~ '^[A-Za-z .''-]+$' then
      update public.candidates set full_name = n where id = new.id and nullif(trim(full_name), '') is null;
    end if;
  exception when others then
    null; -- never block sign-in
  end;
  return new;
end $$;
revoke all on function public.fill_profile_from_oauth() from public, anon, authenticated;
create trigger zz_fill_profile_from_oauth
  after insert or update of raw_user_meta_data on auth.users
  for each row execute function public.fill_profile_from_oauth();