-- LiveTracker security hardening. Review, then run in the Supabase SQL editor.
-- Applied to the production project on 2026-10-06 (statement by statement; keep for reference).

-- 1. CRITICAL: any user could run UPDATE profiles SET is_admin = true on their own row
--    (profiles_update has no column restriction), and a team manager could do it to members.
--    Admin status gives read access to every user's lives/payments. Only admins may change it.
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin
     and auth.uid() is not null            -- SQL editor / service role (no JWT) stays allowed
     and not public.is_current_user_admin() then
    raise exception 'Only an admin can change is_admin';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- Keep a user from creating their own profile already flagged as admin.
create or replace function public.protect_profile_insert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.is_admin is true and auth.uid() is not null and not public.is_current_user_admin() then
    new.is_admin := false;
  end if;
  return new;
end;
$$;
drop trigger if exists protect_profile_insert on public.profiles;
create trigger protect_profile_insert
  before insert on public.profiles
  for each row execute function public.protect_profile_insert();

-- 2. kick_from_team: with no JWT, auth.uid() is null, every check evaluates to NULL and the
--    "not authorized" branch never fires, so an anonymous caller could remove anyone from a team.
create or replace function public.kick_from_team(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  target_team uuid;
  caller_is_admin boolean;
  caller_has_rights boolean;
begin
  if caller is null then raise exception 'No autorizado'; end if;
  select coalesce(is_admin, false) into caller_is_admin from profiles where id = caller;
  select team_id into target_team from profiles where id = target_user_id;
  if target_team is null then raise exception 'Usuario no está en equipo'; end if;
  select exists(
    select 1 from teams
    where id = target_team
    and (manager_id = caller or caller = any(coalesce(co_managers,'{}')))
  ) into caller_has_rights;
  if not (coalesce(caller_is_admin,false) or caller_has_rights or caller = target_user_id) then
    raise exception 'No autorizado';
  end if;
  update profiles set team_id = null where id = target_user_id;
end; $$;

create or replace function public.set_co_manager(target_user_id uuid, promote boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  target_team uuid;
  caller_is_admin boolean;
  caller_is_owner boolean;
begin
  if caller is null then raise exception 'No autorizado'; end if;
  select coalesce(is_admin, false) into caller_is_admin from profiles where id = caller;
  select team_id into target_team from profiles where id = target_user_id;
  if target_team is null then raise exception 'Usuario no está en equipo'; end if;
  select exists(select 1 from teams where id = target_team and manager_id = caller) into caller_is_owner;
  if not (coalesce(caller_is_admin,false) or caller_is_owner) then
    raise exception 'Solo el manager o admin puede promover';
  end if;
  if promote then
    update teams set co_managers = array_append(array_remove(coalesce(co_managers,'{}'), target_user_id), target_user_id) where id = target_team;
  else
    update teams set co_managers = array_remove(coalesce(co_managers,'{}'), target_user_id) where id = target_team;
  end if;
end; $$;

-- 3. Functions that must not be callable through /rest/v1/rpc.
revoke execute on function public.kick_from_team(uuid)          from public, anon;
revoke execute on function public.set_co_manager(uuid, boolean) from public, anon;
revoke execute on function public.handle_new_user()             from public, anon, authenticated;
revoke execute on function public.rls_auto_enable()             from public, anon, authenticated;
grant  execute on function public.kick_from_team(uuid)          to authenticated;
grant  execute on function public.set_co_manager(uuid, boolean) to authenticated;

-- 4. is_admin() had a mutable search_path.
alter function public.is_admin() set search_path = public;
