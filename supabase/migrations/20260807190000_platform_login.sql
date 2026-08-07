-- ============================================================================
-- 20260807190000_platform_login.sql
-- Resolve a login name to its account email, for BOTH kinds of account.
--
-- 20260807180000 put logins on `profiles`, which works for everyone inside an
-- organization. It cannot work for a super admin: they are deliberately above
-- orgs and have no profile row at all, so their login has to live in
-- app_metadata (which is also the only place their role lives, and is not
-- user-editable).
--
-- One function now answers both, so the sign-in action has a single lookup:
--   • an org member  -> profiles.username
--   • a super admin  -> auth.users.raw_app_meta_data->>'username'
--
-- SECURITY: this reads auth.users and maps a guessable name to an email
-- address, so it is service_role ONLY — execute is revoked from public, anon
-- and authenticated. The sign-in action calls it on the admin client, and
-- answers identically whether the login is unknown or the password is wrong,
-- so the form still cannot be used to enumerate accounts.
-- ============================================================================

create or replace function public.email_for_login(p_login text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select u.email
    from auth.users u
   where u.id = (
     select p.id
       from public.profiles p
      where p.username = lower(p_login)
     union all
     select su.id
       from auth.users su
      where lower(su.raw_app_meta_data ->> 'username') = lower(p_login)
        and coalesce(su.raw_app_meta_data ->> 'role', '') = 'super_admin'
     limit 1
   )
$$;

revoke execute on function public.email_for_login(text) from public;
revoke execute on function public.email_for_login(text) from anon;
revoke execute on function public.email_for_login(text) from authenticated;
grant  execute on function public.email_for_login(text) to service_role;
